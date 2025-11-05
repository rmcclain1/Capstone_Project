class Api::V1::SessionsController < ApplicationController
  # Clients hit this WITHOUT a Rails JWT (they only have a Firebase ID token)
  skip_before_action :authorize_request, only: [:create, :me]

  include AuthenticateFirebase  # <<— see concern below

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

  def user_payload(u)
    {
      id: u.id,
      email: u.email,
      username: u.username, # keep if you still store a display handle
      first_name: u.first_name,
      last_name: u.last_name,
      name: [u.first_name, u.last_name].compact.join(' ').presence,
      avatar_url: u.avatar_url,
      provider: u.provider,
      firebase_uid: u.firebase_uid,
      state: u.location
    }
  end
end
