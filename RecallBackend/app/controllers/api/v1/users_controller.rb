# app/controllers/api/v1/users_controller.rb
class Api::V1::UsersController < ApplicationController
  # Allow sign-up without a token
  skip_before_action :authorize_request, only: [:create]

  def index
    render json: User.all
  end

  def show
    user = User.find(params[:id])
    render json: user
  end

  def create
    user = User.new(user_params_for_create)
    if user.save
      render json: { user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    return render json: { error: 'Forbidden' }, status: :forbidden unless current_user&.id == params[:id].to_i

    begin
      permitted = permitted_update_params
      Rails.logger.info("Users#update permitted: #{permitted.inspect}")

      if current_user.update(permitted)
        render json: current_user, status: :ok
      else
        render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActiveModel::UnknownAttributeError => e
      # Likely sending a field that doesn't exist in your users table
      Rails.logger.error("UnknownAttributeError: #{e.message}")
      render json: { error: e.message }, status: :unprocessable_entity
    rescue => e
      Rails.logger.error(e.full_message)
      render json: { error: 'Server error' }, status: :internal_server_error
    end
  end

  private

  def permitted_update_params
    # fields you conceptually allow:
    allowed = %i[
      username email first_name last_name phone_number birthday location avatar_url allergies
    ]

    # intersect with real columns in DB:
    existing = allowed & User.column_names.map(&:to_sym)

    # permit those; handle allergy array if present:
    p = params.require(:user).permit(*existing, allergies: [])

    # if birthday is a DATE column, coerce safely
    if p[:birthday].present? && User.columns_hash['birthday']&.type == :date
      p[:birthday] = Date.parse(p[:birthday]) rescue nil
    end

    p
  end
end
