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
        Rails.logger.error("User update failed: #{current_user.errors.full_messages}")
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

  # api/v1/users/me
  def update_me
    return render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user

    begin
      permitted = permitted_update_params
      Rails.logger.info("Users#update_me permitted: #{permitted.inspect}")

      if current_user.update(permitted)
        render json: current_user, status: :ok
      else
        Rails.logger.error("User update failed: #{current_user.errors.full_messages}")
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

  def permitted_update_params
    # Define all allowed parameters (both old and new field names)
    allowed = %i[
      username email first_name last_name 
      phone_number phonenumber 
      birthday location 
      profile_picture_url avatar_url
      allergies expo_push_token
    ]

    # Get only columns that exist in the database
    db_columns = User.column_names.map(&:to_sym)
    
    # Permit parameters (including legacy fields)
    p = params.require(:user).permit(*allowed, allergies: [])

    # Clean Empty Strings
  p.each do |key, value|
    if value.is_a?(String) && value.strip.empty?
    # Special handling for avatar fields - remove them entirely if empty
      if [:avatar_url, :profile_picture_url].include?(key.to_sym)
      p.delete(key)
      else
      p[key] = nil
      end
  # Handle JavaScript undefined that comes as string
    elsif value == "undefined" || value == "null"
    p.delete(key)
    end
  end


    # Field Mapping for Backward Compatibility
    
    # Handle phonenumber -> phone_number mapping
    if p[:phonenumber].present? && db_columns.include?(:phone_number)
      p[:phone_number] = p[:phonenumber]
      p.delete(:phonenumber)
    elsif p[:phone_number].present? && db_columns.include?(:phonenumber)
      p[:phonenumber] = p[:phone_number]
      p.delete(:phone_number)
    elsif p.key?(:phonenumber) && !db_columns.include?(:phone_number) && !db_columns.include?(:phonenumber)
      p.delete(:phonenumber)
    end

    # Handle avatar_url -> profile_picture_url mapping
    # ONLY map if the value is actually present (not nil, not empty)
    if p[:avatar_url].present? && db_columns.include?(:profile_picture_url)
      p[:profile_picture_url] = p[:avatar_url]
      p.delete(:avatar_url)
    elsif p[:profile_picture_url].present? && db_columns.include?(:avatar_url)
      p[:avatar_url] = p[:profile_picture_url]
      p.delete(:profile_picture_url)
    else
      # Remove both if neither is present or neither column exists
      p.delete(:avatar_url) unless p[:avatar_url].present?
      p.delete(:profile_picture_url) unless p[:profile_picture_url].present?
    end

    # Type Coercion
    
    # Handle birthday as DATE column
    if p[:birthday].present? && User.columns_hash['birthday']&.type == :date
      begin
        p[:birthday] = Date.parse(p[:birthday])
      rescue ArgumentError, TypeError
        Rails.logger.warn("Invalid birthday format: #{p[:birthday]}")
        p[:birthday] = nil
      end
    end

    # Handle allergies normalization
    if p.key?(:allergies)
      if p[:allergies].present?
        p[:allergies] = normalize_allergies(p[:allergies])
      else
        p[:allergies] = nil
      end
    end

    # Remove any parameters that don't correspond to actual DB columns
    final_params = p.to_h.select { |key, _| db_columns.include?(key.to_sym) }
    
    ActionController::Parameters.new(final_params).permit!
  end

  def user_params_for_create
    params.require(:user).permit(
      :username,
      :email,
      :password,
      :password_confirmation
    )
  end

  # Normalize allergies to JSON array string for database storage
  def normalize_allergies(allergies)
    case allergies
    when Array
      # Filter out empty strings
      clean_allergies = allergies.reject { |a| a.blank? }
      
      # Return nil if array is empty after filtering
      return nil if clean_allergies.empty?
      
      # Already an array, convert to JSON string if DB stores as string
      if User.columns_hash['allergies']&.type == :string
        clean_allergies.to_json
      else
        clean_allergies
      end
    when String
      # If it's already JSON string, validate and return
      begin
        parsed = JSON.parse(allergies)
        clean_allergies = parsed.reject { |a| a.blank? }
        return nil if clean_allergies.empty?
        clean_allergies.to_json
      rescue JSON::ParserError
        # Not JSON, treat as comma-separated
        clean_allergies = allergies.split(',').map(&:strip).reject(&:blank?)
        return nil if clean_allergies.empty?
        clean_allergies.to_json
      end
    else
      nil
    end
  end
end
