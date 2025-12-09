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

      token = fetch_access_token
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

      lines = extract_lines(doc)
      candidates = lines
        .map { |s| normalize(s) }
        .reject { |s| s.empty? || header_or_footer?(s) }
        .uniq
        .take(50)  # Increased limit, filter on frontend if needed

      candidates.map do |line|
        qty = extract_quantity(line)
        { 
          raw: line, 
          qty: qty, 
          name: strip_qty(line),
          confidence: calculate_confidence(line)
        }
      end.sort_by { |item| -item[:confidence] }  # Sort by confidence
    rescue => e
      Rails.logger.error "DocAI REST failed: #{e.class}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      []
    end

    def extract_quantity(line)
      # Try multiple quantity patterns
      patterns = [
        /\b(?:qty|quantity)\s*[:=]?\s*(\d+)/i,
        /\b(\d+)\s*x\b/i,
        /\bx\s*(\d+)\b/i,
        /\b(\d+)\s*@\b/i,  # e.g., "2 @ $5.99"
      ]
      
      patterns.each do |pattern|
        match = line.match(pattern)
        return match[1].to_i if match && match[1].to_i > 0
      end
      
      1  # Default to 1
    end

    def calculate_confidence(line)
      score = 50  # Base score
      
      # Boost for reasonable length
      score += 20 if line.length.between?(5, 40)
      
      # Boost for containing price indicators
      score += 15 if line =~ /\$\d+\.\d{2}/
      
      # Penalize very short or very long
      score -= 20 if line.length < 3
      score -= 15 if line.length > 50
      
      # Penalize if mostly numbers
      number_ratio = line.scan(/\d/).length.to_f / line.length
      score -= 20 if number_ratio > 0.6
      
      score.clamp(0, 100)
    end

    def mime_type(path)
      ext = File.extname(path).downcase
      case ext
      when ".jpg", ".jpeg" then "image/jpeg"
      when ".png"          then "image/png"
      when ".pdf"          then "application/pdf"
      else "application/octet-stream"
      end
    end

    def http_post_json(url, payload, bearer)
      uri = URI.parse(url)
      req = Net::HTTP::Post.new(uri)
      req["Authorization"] = "Bearer #{bearer}"
      req["Content-Type"]  = "application/json"
      req.body = JSON.dump(payload)

      Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
    end

    def fetch_access_token
      require "googleauth"
      scope = ["https://www.googleapis.com/auth/cloud-platform"]
      creds = Google::Auth::ServiceAccountCredentials.make_creds(scope: scope)
      creds.fetch_access_token!["access_token"]
    end

    def extract_lines(doc)
      return [] unless doc
      text = doc["text"].to_s
      out = []

      pages = doc["pages"] || []
      pages.each do |page|
        (page["lines"] || []).each do |ln|
          out << text_for_anchor(text, ln.dig("layout", "textAnchor"))
        end
      end
      out.compact.map(&:strip).reject(&:empty?)
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
      s.strip
       .gsub(/[^\S\r\n]+/, " ")      # Normalize whitespace
       .gsub(/[^[:print:]\s]/, "")   # Remove non-printable
    end

    def header_or_footer?(s)
      return true if s.length < 3 || s.length > 70
      
      # Common receipt header/footer patterns
      exclude_patterns = [
        /\b(subtotal|total|tax|change|balance)\b/i,
        /\b(thank you|visit again|welcome)\b/i,
        /\b(receipt|store|location)\b/i,
        /\b(visa|mastercard|amex|discover|card|payment)\b/i,
        /\b(date|time|cashier|register)\b/i,
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  # Date formats
        /^\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?$/i,  # Time formats
        /^store\s*#?\d+$/i,
        /^www\./i,
        /^\*+$/,  # Decorative stars
      ]
      
      exclude_patterns.any? { |pattern| s =~ pattern }
    end

    def strip_qty(s)
      s.gsub(/\b(?:qty|quantity)\s*[:=]?\s*\d+\b/i, "")
       .gsub(/\b\d+\s*x\b/i, "")
       .gsub(/\bx\s*\d+\b/i, "")
       .gsub(/\b\d+\s*@\b/i, "")
       .strip
    end
  end

  module Stub
    module_function
    def extract_items(_image_path)
      [
        { raw: "CHEERIOS 12OZ", qty: 1, name: "Cheerios 12 oz", confidence: 85 },
        { raw: "MILK 1 GAL",    qty: 1, name: "Whole Milk 1 gal", confidence: 90 }
      ]
    end
  end
end