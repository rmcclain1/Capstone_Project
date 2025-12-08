# app/controllers/api/v1/users_controller.rb
class Api::V1::UsersController < ApplicationController
  # Allow sign-up without a token
  skip_before_action :authorize_request, only: [:create]

  # INDEX method
  def index
    render json: User.all
  end

  # SHOW method
  def show
    user = User.find(params[:id])
    render json: user
  end

  # CREATE method (basic local signup – optional if you mostly use Firebase)
  def create
    user = User.new(user_params_for_create)
    if user.save
      render json: { user: user }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # UPDATE method
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
      Rails.logger.error("UnknownAttributeError: #{e.message}")
      render json: { error: e.message }, status: :unprocessable_entity
    rescue => e
      Rails.logger.error(e.full_message)
      render json: { error: 'Server error' }, status: :internal_server_error
    end
  end

  # POST /api/v1/users/verify_password
  def verify_password
    return render json: { error: 'Forbidden' }, status: :forbidden unless current_user

    if current_user.authenticate(params[:old_password])
      render json: { valid: true }, status: :ok
    else
      render json: { valid: false }, status: :unauthorized
    end
  end

  # PATCH /api/v1/users/update_password
  def update_password
    return render json: { error: 'Forbidden' }, status: :forbidden unless current_user

    if current_user.authenticate(params[:old_password])
      if current_user.update(password: params[:new_password])
        render json: { message: 'Password updated successfully' }, status: :ok
      else
        render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Incorrect current password' }, status: :unauthorized
    end
  end

  private

  # Merge of main + mcclain1
  def permitted_update_params
    allowed = %i[
      username email first_name last_name phone_number phonenumber birthday
      location profile_picture_url allergies expo_push_token
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

  def user_params_for_create
    params.require(:user).permit(
      :username,
      :email,
      :password,
      :password_confirmation
    )
  end
end
