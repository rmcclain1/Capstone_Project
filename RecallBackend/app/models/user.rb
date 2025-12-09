# app/models/user.rb
class User < ApplicationRecord
  has_secure_password validations: false

  has_many :pantries, dependent: :destroy
  has_one_attached :avatar

  # Core validations
  validates :firebase_uid, presence: true, uniqueness: true
  validates :email, uniqueness: { case_sensitive: false }, allow_nil: true
  validates :username, uniqueness: { case_sensitive: false }, allow_nil: true

  before_validation :normalize_email

  private

  def normalize_email
    self.email = email.to_s.strip.downcase if email.present?
  end
end