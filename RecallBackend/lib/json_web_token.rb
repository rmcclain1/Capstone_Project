# RecallBackend/lib/json_web_token.rb
require 'jwt'

class JsonWebToken
  ALGO   = 'HS256'.freeze
  SECRET = ENV.fetch('RAILS_JWT_SECRET') { Rails.application.secret_key_base }

  def self.encode(payload = nil, exp: 14.days.from_now, **kw)
    data = (payload || {}).dup
    data.merge!(kw) unless kw.empty?
    data[:exp] = exp.to_i
    JWT.encode(data, SECRET, ALGO)
  end

  def self.decode(token)
    body, = JWT.decode(token, SECRET, true, algorithm: ALGO)
    HashWithIndifferentAccess.new(body)
  end
end
