# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  before_action :authorize_request

  private

  def authorize_request
    header = request.headers['Authorization'].to_s
    token = header[/\ABearer (.+)\z/, 1]
    unless token
      @current_user = nil
      return render json: { ok: false, error: 'Not Authorized' }, status: :unauthorized
    end

    decoded = JsonWebToken.decode(token)
    @current_user = User.find_by(id: decoded[:user_id])
    return render json: { ok: false, error: 'Not Authorized' }, status: :unauthorized unless @current_user
  rescue => e
    render json: { ok: false, error: e.message }, status: :unauthorized
  end
end
