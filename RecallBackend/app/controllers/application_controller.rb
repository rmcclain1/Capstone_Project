# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  before_action :authorize_request
  attr_reader :current_user

  private

  def authorize_request
    header = request.headers['Authorization'].to_s
    token  = header[/\ABearer (.+)\z/, 1]
    return render_unauthorized('Missing token') unless token

    decoded = JsonWebToken.decode(token)
    @current_user = User.find_by(id: decoded[:user_id])
    return render_unauthorized('User not found') unless @current_user
  rescue JWT::ExpiredSignature
    render_unauthorized('Token expired')
  rescue JWT::DecodeError => e
    render_unauthorized("Invalid token: #{e.message}")
  rescue => e
    Rails.logger.warn("[authorize_request] #{e.class}: #{e.message}")
    render_unauthorized('Not Authorized')
  end

  # Alias for authenticate_user! (used by organization controllers)
  def authenticate_user!
    authorize_request
  end

  # Helper to check if user is authenticated
  def user_signed_in?
    current_user.present?
  end

  def render_unauthorized(msg)
    render json: { ok: false, error: msg }, status: :unauthorized
  end
end