# app/services/apple_sign_in_service.rb
class AppleSignInService
  def self.verify_identity_token(identity_token)
    begin
      # Verify and decode the identity token from Apple
      validator = AppleID::IdTokenValidator.new(identity_token)
      claims = validator.call

      # Return the verified claims
      {
        success: true,
        user_id: claims['sub'],           # Unique Apple user ID
        email: claims['email'],           # User's email (if shared)
        email_verified: claims['email_verified'] == 'true',
        is_private_email: claims['is_private_email'] == 'true'
      }
    rescue AppleID::IdTokenValidator::ValidationError => e
      Rails.logger.error("[Apple Sign-In] Validation failed: #{e.message}")
      { success: false, error: e.message }
    rescue => e
      Rails.logger.error("[Apple Sign-In] Unexpected error: #{e.message}")
      { success: false, error: 'Apple sign-in verification failed' }
    end
  end
end
