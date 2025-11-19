# app/services/expo_push_service.rb
require 'net/http'
require 'uri'
require 'json'

class ExpoPushService
  EXPO_URL = 'https://exp.host/--/api/v2/push/send'.freeze

  def self.send_to(user, title:, body:, data: {})
    return unless user&.expo_push_token.present?

    payload = {
      to: user.expo_push_token,
      sound: 'default',
      title: title,
      body: body,
      data: data
    }

    uri = URI.parse(EXPO_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE  # Add this line for development

    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = payload.to_json

    response = http.request(request)
    Rails.logger.info "Expo push response: #{response.code} #{response.body}"

    response
  rescue => e
    Rails.logger.error "Expo push service error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    nil
  end
end