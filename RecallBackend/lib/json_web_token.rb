# app/lib/json_web_token.rb
class JsonWebToken
  SECRET = ENV.fetch('RAILS_JWT_SECRET') { Rails.application.secret_key_base }

  def self.encode(payload, exp: 14.days.from_now)
    payload = payload.dup
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET, 'HS256')
  end

  def self.decode(token)
    body, = JWT.decode(token, SECRET, true, { algorithm: 'HS256' })
    HashWithIndifferentAccess.new(body)
  rescue JWT::ExpiredSignature
    raise StandardError, 'Token expired'
  rescue JWT::DecodeError => e
    raise StandardError, "Invalid token: #{e.message}"
  end
end
