# RecallBackend/app/controllers/api/v1/ai_controller.rb
require "net/http"
require "uri"
require "json"

module Api
  module V1
    class AiController < ApplicationController
      # In API mode there may be no CSRF filter defined; don't raise if it's missing.
      skip_before_action :verify_authenticity_token, raise: false

      # POST /api/v1/ai/chat
      def chat
        # Support body shapes: { messages: [...] } or { ai: { messages: [...] } }
        messages = params[:messages].presence || params.dig(:ai, :messages).presence || []
        user_id  = params[:user_id]

        pantry_names = []
        begin
          if respond_to?(:current_user) && current_user
            # Pick a "name-like" column if one exists, otherwise skip.
            cols = Pantry.column_names
            name_col = %w[name title label pantry_name].find { |c| cols.include?(c) }
            if name_col
              pantry_names = current_user.pantries.limit(10).pluck(name_col)
            end
          end
        rescue => e
          Rails.logger.warn("AI pantry context failed: #{e.class}: #{e.message}")
          pantry_names = []
        end

        system_prompt = <<~PROMPT
          You are Recall App's AI assistant. Be concise and accurate.
          You can answer questions about FDA food recalls, conceptually check a user's pantry items,
          and suggest safe alternatives and simple recipes using pantry items.
          If you are not sure, ask a short follow-up question.
          Today's date: #{Time.zone.today}.
          If the user asks about their pantry, they might have pantries named: #{pantry_names.join(", ")}.
        PROMPT

        # --- Provider config ---
        openai_model = ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
        openai_key   = ENV["OPENAI_API_KEY"]
        if openai_key.blank?
          return render json: { reply: "AI is not configured on the server (missing API key)." }
        end

        payload = {
          model: openai_model,
          messages: [{ role: "system", content: system_prompt }] +
                    Array(messages).map { |m|
                      { role: m[:role].to_s, content: m[:content].to_s }
                    },
          temperature: 0.3,
        }

        uri = URI.parse(ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com") + "/v1/chat/completions")

        begin
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = (uri.scheme == "https")

          req = Net::HTTP::Post.new(uri.request_uri)
          req["Content-Type"]  = "application/json"
          req["Authorization"] = "Bearer #{openai_key}"
          req.body = JSON.dump(payload)

          resp = http.request(req)
          code = resp.code.to_i

          if code == 429
            Rails.logger.warn("AI quota/rate limit: #{resp.body}")
            return render json: {
              reply: "I’m currently at capacity. Please try again in a moment."
            }
          elsif code >= 400
            Rails.logger.error("AI provider error #{code}: #{resp.body}")
            return render json: {
              reply: "I couldn’t reach the AI provider just now. Try again shortly."
            }
          end

          body  = JSON.parse(resp.body) rescue {}
          reply = body.dig("choices", 0, "message", "content").to_s
          reply = "Sorry, I don’t have an answer right now." if reply.blank?
          render json: { reply: reply }

        rescue => e
          Rails.logger.error("AI call failed: #{e.class}: #{e.message}")
          render json: {
            reply: "I ran into a network issue contacting the AI. Please try again."
          }
        end
      end
    end
  end
end
