class Api::V1::SessionsController < ApplicationController
  skip_before_action :authorize_request, only: [:create]

  def create
    Rails.logger.info("Login Params: #{params.inspect}")

    username = params[:username] || params.dig(:session, :username)
    password = params[:password] || params.dig(:session, :password)

    user = User.find_by(username: username)

    if user&.authenticate(password)
      token = JsonWebToken.encode(user_id: user.id)
      render json: { token: token, user: user }, status: :ok
    else
      render json: { error: 'Invalid username or password' }, status: :unauthorized
    end
  end

  def destroy
    render json: { message: 'Logged out' }, status: :ok
  end
end
