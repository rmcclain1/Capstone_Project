# app/services/food_event_summarizer.rb
class FoodEventSummarizer
  include HTTParty
  base_uri "https://api.openai.com/v1"

  def self.call(event)
    prompt = <<~PROMPT
      You are helping a consumer understand a US food recall.

      Data:
      - Product description: #{event.product_description}
      - Recalling firm: #{event.recalling_firm}
      - Reason for recall: #{event.reason_for_recall}
      - Product type: #{event.product_type}
      - Code info / lot: #{event.code_info}
      - Classification: #{event.classification}
      - Report date: #{event.report_date}

      Please respond ONLY as JSON, no extra text, with this exact shape:

      {
        "status": "likely affected" | "probably not affected" | "status unclear",
        "bullets": [
          "2–3 short bullet points explaining in plain language"
        ]
      }
    PROMPT

    body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant for food recall consumers." },
        { role: "user",   content: prompt }
      ]
    }

    resp = post(
      "/chat/completions",
      headers: {
        "Authorization" => "Bearer #{ENV.fetch("OPENAI_API_KEY")}",
        "Content-Type"  => "application/json"
      },
      body: body.to_json
    )

    unless resp.success?
      Rails.logger.error("[FoodEventSummarizer] OpenAI error #{resp.code}: #{resp.body}")
      return {
        "status"  => "unclear",
        "bullets" => ["Unable to generate AI summary right now."],
        "error"   => "OpenAI HTTP #{resp.code}"
      }
    end

    data = JSON.parse(resp.body)
    content = data.dig("choices", 0, "message", "content") || ""

    begin
      JSON.parse(content)
    rescue JSON::ParserError => e
      Rails.logger.error("[FoodEventSummarizer] JSON parse error: #{e.message}, content: #{content.inspect}")
      {
        "status"  => "unclear",
        "bullets" => ["Unable to generate AI summary right now."],
        "error"   => "AI JSON parse error"
      }
    end
  rescue => e
    Rails.logger.error("[FoodEventSummarizer] #{e.class}: #{e.message}")
    {
      "status"  => "unclear",
      "bullets" => ["Unable to generate AI summary right now."],
      "error"   => e.message
    }
  end
end
