# app/controllers/concerns/authenticate_firebase.rb
require 'net/http'
require 'json'
require 'jwt'
require 'openssl'

module AuthenticateFirebase
  extend ActiveSupport::Concern
  GOOGLE_CERTS_URL = URI('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')

  def authenticate_firebase!
    header = request.headers['Authorization'].to_s
    id_token = header[/\ABearer (.+)\z/, 1]
    return render(json: { ok: false, error: 'Missing Firebase bearer token' }, status: :unauthorized) unless id_token
    verify_firebase_id_token(id_token)
  rescue => e
    render json: { ok: false, error: e.message }, status: :unauthorized
  end

  def verify_firebase_id_token(id_token)
    decoded, = JWT.decode(
      id_token, nil, true,
      {
        algorithms: ['RS256'],
        iss: "https://securetoken.google.com/#{FIREBASE_PROJECT_ID}",
        verify_iss: true,
        aud: FIREBASE_PROJECT_ID,
        verify_aud: true
      }
    ) do |header|
      kid = header['kid'] or raise 'Missing kid'
      cert_pem = google_certs[kid] or raise 'Unknown kid'
      OpenSSL::X509::Certificate.new(cert_pem).public_key
    end
    decoded
  end

  def google_certs
    @google_certs ||= Rails.cache.fetch('google_firebase_jwks', expires_in: 5.minutes) do
      res = Net::HTTP.get_response(GOOGLE_CERTS_URL)
      raise "Failed to fetch Google certs: #{res.code}" unless res.is_a?(Net::HTTPSuccess)
      JSON.parse(res.body)
    end
  end
end
