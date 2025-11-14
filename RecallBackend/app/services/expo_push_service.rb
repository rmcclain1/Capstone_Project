# app/services/expo_push_service.rb
require 'net/http'
require 'uri'
require 'json'

class ExpoPushService
  EXPO_URL = 'https://exp.host/--/api/v2/push/send'.freeze

  def self.send_to(user, title:, body:)
    return unless user&.expo_push_token.present?

    payload = {
      to: user.expo_push_token,
      sound: 'default',
      title: title,
      body: body
    }

    uri = URI.parse(EXPO_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = payload.to_json

    response = http.request(request)
    Rails.logger.info "Expo push response: #{response.code} #{response.body}"
    response
  end
end
