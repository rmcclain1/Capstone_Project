# app/services/expo_push_service.rb
require 'net/http'
require 'uri'
require 'json'

class ExpoPushService
  EXPO_URL = 'https://exp.host/--/api/v2/push/send'.freeze

  # Keep original method for backward compatibility
  def self.send_to(user, title:, body:)
    return unless user&.expo_push_token.present?
    
    send_notification(
      token: user.expo_push_token,
      title: title,
      body: body
    )
  end

  # NEW: Method that Notification model actually calls
  def self.send_notification(token:, title:, body:, data: {})
    return unless token.present?

    payload = {
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data
    }

    uri = URI.parse(EXPO_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = payload.to_json

    response = http.request(request)
    Rails.logger.info "Expo push response: #{response.code} #{response.body}"
    response
  rescue => e
    Rails.logger.error "Expo push error: #{e.class}: #{e.message}"
    nil
  end
end
