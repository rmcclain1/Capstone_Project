class Api::V1::UsersController < ApplicationController
  # Allow sign-up without a token
  skip_before_action :authorize_request, only: [:create]

  def index
    users = User.all
    render json: users
  end

  def show
    user = User.find(params[:id])
    render json: user
  end

  def create
    user = User.new(user_params)
    if user.save
      render json: { user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    # Permit credential fields
    params.require(:user).permit(:username, :email, :password, :password_confirmation)
  end
end
