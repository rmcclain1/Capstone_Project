# app/services/expo_push_service.rb
require 'net/http'
require 'uri'
require 'json'

class ExpoPushService
  EXPO_URL = 'https://exp.host/--/api/v2/push/send'.freeze
  TIMEOUT_SECONDS = 10

  # Keep original method for backward compatibility
  def self.send_to(user, title:, body:)
    return unless user&.expo_push_token.present?
    
    send_notification(
      token: user.expo_push_token,
      title: title,
      body: body,
      user: user
    )
  end

  # Main method that Notification model calls
  def self.send_notification(token:, title:, body:, data: {}, user: nil)
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
    http.open_timeout = TIMEOUT_SECONDS
    http.read_timeout = TIMEOUT_SECONDS

    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = payload.to_json

    response = http.request(request)
    
    # Parse response to check for errors
    if response.code == '200'
      begin
        result = JSON.parse(response.body)
        
        # Expo returns {"data": [{"status": "error", "details": {...}}]}
        if result.dig('data', 0, 'status') == 'error'
          error_details = result.dig('data', 0, 'details')
          error_type = error_details&.dig('error')
          
          Rails.logger.warn "Expo push error: #{error_type} - #{error_details}"
          
          # Clear invalid tokens
          if error_type == 'DeviceNotRegistered' && user.present?
            Rails.logger.info "Clearing invalid token for user #{user.id}"
            user.update_column(:expo_push_token, nil)
          end
        else
          Rails.logger.info "Expo push sent successfully: #{response.body}"
        end
      rescue JSON::ParserError => e
        Rails.logger.error "Failed to parse Expo response: #{e.message}"
      end
    else
      Rails.logger.error "Expo push failed: HTTP #{response.code} - #{response.body}"
    end
    
    response
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    Rails.logger.error "Expo push timeout: #{e.class} - #{e.message}"
    nil
  rescue => e
    Rails.logger.error "Expo push error: #{e.class}: #{e.message}"
    Rails.logger.error e.backtrace.first(5).join("\n")
    nil
  end
end
