# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

if Rails.env.development?
  unless User.exists?(username: "admin")
    User.create!(
      username: "admin",
      email: "admin@example.com",
      password: "AdminPass123!",
      password_confirmation: "AdminPass123!"
    )
    puts "Seeded dev admin user: admin / AdminPass123!"
  end
end