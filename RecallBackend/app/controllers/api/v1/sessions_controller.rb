class Api::V1::SessionsController < ApplicationController
  # Clients hit this WITHOUT a Rails JWT (they only have a Firebase ID token)
  skip_before_action :authorize_request, only: [:create, :me]

  include AuthenticateFirebase

  # POST /api/v1/sessions
  # Expect: Authorization: Bearer <FIREBASE_ID_TOKEN>
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
    user.avatar_url ||= payload['picture']

    if payload['name'].present? && user.first_name.blank? && user.last_name.blank?
      parts = payload['name'].split(' ')
      user.first_name = parts.first
      user.last_name  = parts.drop(1).join(' ').presence
    end

    user.save!

    token = JsonWebToken.encode(user_id: user.id)
    render json: { ok: true, token: token, user: user_payload(user) }, status: :ok
  rescue => e
    # Log the real cause so 401s aren’t silent
    Rails.logger.error("[sessions#create] #{e.class}: #{e.message}\n#{e.backtrace&.join("\n")}")
    render json: { ok: false, error: e.message }, status: :unauthorized
  end

  # DELETE /api/v1/sessions  (client just forgets token; nothing to revoke)
  def destroy
    render json: { ok: true, message: 'Logged out' }, status: :ok
  end

  # GET /api/v1/me  (requires Rails JWT)
  def me
    return render json: { ok: false, error: 'Not Authorized' }, status: :unauthorized unless @current_user
    render json: { ok: true, user: user_payload(@current_user) }
  end

  private

  # Make this tolerant of missing columns/attrs so it never crashes
  def user_payload(u)
    {
      id: u.id,
      email: u.try(:email),
      username: u.try(:username),
      first_name: u.try(:first_name),
      last_name: u.try(:last_name),
      name: [u.try(:first_name), u.try(:last_name)].compact.join(' ').presence,
      avatar_url: u.try(:avatar_url),
      provider: u.try(:provider),
      firebase_uid: u.try(:firebase_uid),

      # If you don't have a `location` column, this will just be nil instead of raising.
      state: u.try(:location)
    }
  end
end
