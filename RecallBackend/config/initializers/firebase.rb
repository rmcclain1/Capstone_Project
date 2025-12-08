# config/initializers/firebase.rb

# Configure Firebase settings for ID-token verification.
Rails.application.config.x.firebase = ActiveSupport::InheritableOptions.new(
  project_id: ENV['FIREBASE_PROJECT_ID'], # <-- set this in your env
  certs_url:  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
  cache_key:  'google_firebase_jwks',
  cache_ttl:  5.minutes
)

# Expose a simple constant used by the AuthenticateFirebase concern.
FIREBASE_PROJECT_ID = Rails.application.config.x.firebase.project_id

# Helpful safety checks.
if Rails.env.production?
  raise "FIREBASE_PROJECT_ID is not set" if FIREBASE_PROJECT_ID.blank?
else
  if FIREBASE_PROJECT_ID.blank?
    Rails.logger.warn("[firebase] FIREBASE_PROJECT_ID is not set; ID-token verification will fail until you set it.")
  end

  # Ensure there is *some* cache for JWKS in dev.
  if Rails.cache.nil?
    Rails.logger.warn("[firebase] Rails.cache is nil; using :memory_store for dev.")
    Rails.application.config.cache_store = :memory_store
  end
end
