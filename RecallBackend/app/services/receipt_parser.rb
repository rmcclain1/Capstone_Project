# app/services/receipt_parser.rb
require "net/http"
require "uri"
require "json"
require "base64"

class ReceiptParser
  def self.extract_items(image_path)
    engine = ENV.fetch("RECEIPT_ENGINE", "docai_rest")
    case engine
    when "docai_rest" then DocAI_REST.extract_items(image_path)
    else                   Stub.extract_items(image_path)
    end
  end

  module DocAI_REST
    module_function

    def extract_items(image_path)
      endpoint = "https://#{ENV.fetch("DOCAI_LOCATION", "us")}-documentai.googleapis.com/v1/" \
                 "projects/#{ENV.fetch("DOCAI_PROJECT")}/locations/#{ENV.fetch("DOCAI_LOCATION", "us")}" \
                 "/processors/#{ENV.fetch("DOCAI_PROCESSOR_ID")}:process"

      token = fetch_access_token # uses googleauth under the hood
      body = {
        rawDocument: {
          content:  Base64.strict_encode64(File.binread(image_path)),
          mimeType: mime_type(image_path)
        }
      }

      res = http_post_json(endpoint, body, token)
      raise "DocAI HTTP #{res.code}: #{res.body}" unless res.is_a?(Net::HTTPSuccess)

      payload = JSON.parse(res.body) rescue {}
      doc = payload.dig("document")

      # Document OCR returns text with pages/lines/paragraphs; build items via heuristics
      lines = extract_lines(doc)
      candidates = lines
        .map { |s| normalize(s) }
        .reject { |s| s.empty? || header?(s) }
        .uniq
        .first(12)

      candidates.map do |line|
        qty = (line[/\b(?:qty|quantity)\s*[:=]?\s*(\d+)/i, 1] ||
               line[/\b(\d+)\s*x\b/i, 1] ||
               line[/\bx\s*(\d+)\b/i, 1]).to_i
        qty = 1 if qty <= 0
        { raw: line, qty: qty, name: strip_qty(line) }
      end
    rescue => e
      Rails.logger.error "DocAI REST failed: #{e.class}: #{e.message}"
      []
    end

    def mime_type(path)
      ext = File.extname(path).downcase
      return "image/jpeg"      if [".jpg", ".jpeg"].include?(ext)
      return "image/png"       if ext == ".png"
      return "application/pdf" if ext == ".pdf"
      "application/octet-stream"
    end

    def http_post_json(url, payload, bearer)
      uri = URI.parse(url)
      req = Net::HTTP::Post.new(uri)
      req["Authorization"] = "Bearer #{bearer}"
      req["Content-Type"]  = "application/json"
      req.body = JSON.dump(payload)

      Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
        http.request(req)
      end
    end

    # -------- access token via googleauth (lightweight) --------
    def fetch_access_token
      require "googleauth"
      scope = ["https://www.googleapis.com/auth/cloud-platform"]
      creds = Google::Auth::ServiceAccountCredentials.make_creds(scope: scope)
      creds.fetch_access_token!["access_token"]
    end

    # -------- helpers to pull lines from Document OCR JSON --------
    def extract_lines(doc)
      return [] unless doc
      text = doc["text"].to_s
      out = []

      pages = doc["pages"] || []
      pages.each do |page|
        (page["lines"] || []).each do |ln|
          out << text_for_anchor(text, ln.dig("layout", "textAnchor"))
        end
        (page["paragraphs"] || []).each do |p|
          out << text_for_anchor(text, p.dig("layout", "textAnchor"))
        end
      end
      out.compact.map { |s| s.strip }
    end

    def text_for_anchor(full_text, anchor)
      return "" unless anchor && anchor["textSegments"].is_a?(Array)
      anchor["textSegments"].map do |seg|
        start = (seg["startIndex"] || 0).to_i
        ed    = (seg["endIndex"]   || 0).to_i
        full_text.byteslice(start, ed - start) || ""
      end.join
    end

    def normalize(s)
      s = s.strip
      s = s.gsub(/[^\S\r\n]+/, " ")
      s = s.gsub(/[^[:print:]\s]/, "")
      s
    end

    def header?(s)
      bad = [
        /\bsubtotal\b/i, /\btotal\b/i, /\btax\b/i, /\bchange\b/i,
        /\bthank you\b/i, /\bvisit again\b/i, /\breceipt\b/i,
        /\bdate\b/i, /\btime\b/i, /\bvisa\b/i, /\bmastercard\b/i, /\bcard\b/i
      ]
      s.length < 3 || s.length > 64 || bad.any? { |r| s =~ r }
    end

    def strip_qty(s)
      s.sub(/\b(?:qty|quantity)\s*[:=]?\s*\d+\b/i, "")
       .sub(/\b\d+\s*x\b/i, "")
       .sub(/\bx\s*\d+\b/i, "")
       .strip
    end
  end

  module Stub
    module_function
    def extract_items(_image_path)
      [
        { raw: "CHEERIOS 12OZ", qty: 1, name: "Cheerios 12 oz" },
        { raw: "MILK 1 GAL",    qty: 1, name: "Whole Milk 1 gal" }
      ]
    end
  end
end
