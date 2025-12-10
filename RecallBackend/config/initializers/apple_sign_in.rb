# config/initializers/apple_sign_in.rb

# Apple Sign-In Configuration
# Key ID from your AuthKey filename (AuthKey_KEYID.p8)
APPLE_KEY_ID = "SW6FZVN583"

# Your Apple Team ID (find this in Apple Developer Portal)
# You need to get this from: https://developer.apple.com/account
APPLE_TEAM_ID = ENV.fetch("APPLE_TEAM_ID", "YOUR_TEAM_ID_HERE")

# Your app's bundle identifier (must match app.json)
APPLE_CLIENT_ID = "recall-app-2b6c6"

# Path to your private key
APPLE_KEY_PATH = Rails.root.join("config", "AuthKey_#{APPLE_KEY_ID}.p8")

# Load the private key at initialization
begin
  APPLE_PRIVATE_KEY = File.read(APPLE_KEY_PATH) if File.exist?(APPLE_KEY_PATH)
rescue => e
  Rails.logger.warn "Failed to load Apple private key: #{e.message}"
  APPLE_PRIVATE_KEY = nil
end
