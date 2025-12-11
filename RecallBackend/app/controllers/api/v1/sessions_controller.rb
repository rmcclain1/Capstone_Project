class Api::V1::SessionsController < ApplicationController
  # Clients hit this WITHOUT a Rails JWT (they only have a Firebase ID token)
  skip_before_action :authorize_request, only: [:create, :apple]

  include AuthenticateFirebase

  # POST /api/v1/sessions
  # Expect: Authorization: Bearer <FIREBASE_ID_TOKEN>
  # Optional: { user_info: { avatar_url, display_name, email } }
  # Return: { ok: true, token: <RAILS_JWT>, user: {...} }
  def create
    bearer = request.headers['Authorization'].to_s
    firebase_id_token = bearer[/\ABearer (.+)\z/, 1]
    return render json: { ok: false, error: 'Missing Firebase bearer token' }, status: :unauthorized unless firebase_id_token

    payload = verify_firebase_id_token(firebase_id_token)

    # Find or create the user for this Firebase identity
    user = User.find_or_initialize_by(firebase_uid: payload['user_id'])
    user.email      ||= payload['email']
    user.provider   ||= (payload.dig('firebase', 'sign_in_provider') || 'password')
    user.avatar_url = payload['picture'] if user.avatar_url.blank? && payload['picture'].present?
    
    # Handle user_info from mobile app (Google/Apple sign-in with profile data)
    if params[:user_info].present?
      user_info = params[:user_info].permit(:avatar_url, :display_name, :email)
      
      # Update avatar from mobile app if provided and user doesn't have one
      if user_info[:avatar_url].present? && user.avatar_url.blank?
        user.avatar_url = user_info[:avatar_url]
      end
      
      # Parse display_name if provided and user doesn't have name set
      if user_info[:display_name].present? && user.first_name.blank? && user.last_name.blank?
        parts = user_info[:display_name].split(' ')
        user.first_name = parts.first
        user.last_name  = parts.drop(1).join(' ').presence
      end
      
      # Use email from user_info if not in payload
      user.email ||= user_info[:email]
    end

    # Fallback to Firebase payload name if still no name set
    if payload['name'].present? && user.first_name.blank? && user.last_name.blank?
      parts = payload['name'].split(' ')
      user.first_name = parts.first
      user.last_name  = parts.drop(1).join(' ').presence
    end

    user.save!

    token = JsonWebToken.encode(user_id: user.id)
    render json: { ok: true, token: token, user: user_payload(user) }, status: :ok
  rescue => e
    # Log the real cause so 401s aren't silent
    Rails.logger.error("[sessions#create] #{e.class}: #{e.message}\n#{e.backtrace&.join("\n")}")
    render json: { ok: false, error: e.message }, status: :unauthorized
  end

  # POST /api/v1/sessions/apple
  # Expect: { identity_token: <APPLE_IDENTITY_TOKEN>, user_info: { email, name } }
  # Return: { ok: true, token: <RAILS_JWT>, user: {...} }
  def apple
    identity_token = params[:identity_token]
    user_info = params[:user_info] || {}

    return render json: { ok: false, error: 'Missing identity token' }, status: :unauthorized unless identity_token

    # Verify the Apple identity token
    result = AppleSignInService.verify_identity_token(identity_token)

    unless result[:success]
      return render json: { ok: false, error: result[:error] || 'Apple verification failed' }, status: :unauthorized
    end

    # Find or create user with Apple ID
    user = User.find_or_initialize_by(apple_uid: result[:user_id])
    
    # Update user info (only if not already set)
    user.email ||= result[:email] || user_info[:email]
    user.provider ||= 'apple.com'
    
    # Parse name from user_info if provided (only on first sign-in)
    if user_info[:name].present? && user.first_name.blank?
      name_parts = user_info[:name].to_s.split(' ')
      user.first_name = name_parts.first
      user.last_name = name_parts.drop(1).join(' ').presence
    end

    user.save!

    # Generate Rails JWT
    token = JsonWebToken.encode(user_id: user.id)
    render json: { ok: true, token: token, user: user_payload(user) }, status: :ok
  rescue => e
    Rails.logger.error("[sessions#apple] #{e.class}: #{e.message}\n#{e.backtrace&.join("\n")}")
    render json: { ok: false, error: e.message }, status: :unauthorized
  end

  # DELETE /api/v1/sessions  (client just forgets token; nothing to revoke)
  def destroy
    render json: { ok: true, message: 'Logged out' }, status: :ok
  end

  # GET /api/v1/me  (requires Rails JWT)
  def me
    return render json: { ok: false, error: 'Not Authorized' }, status: :unauthorized unless @current_user
    render json: { ok: true, user: user_payload(@current_user) }, status: :ok
  end

  private

  # Return a full, up-to-date user profile payload
  # Uses User#as_json (which already normalizes phone_number, avatar_url, allergies, etc.)
  def user_payload(u)
    base = u.as_json

    # Ensure we always have a simple "name" field
    base['name'] ||= [u.try(:first_name), u.try(:last_name)].compact.join(' ').presence

    # Backwards-compatible alias for location
    base['state'] ||= u.try(:location)

    base
  end
end
