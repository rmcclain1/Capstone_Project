class User < ApplicationRecord
  # We still include has_secure_password so legacy/local accounts can exist,
  # but we disable built-in validations because Firebase owns passwords now.
  has_secure_password validations: false

  has_many :pantries, dependent: :destroy
  has_one_attached :avatar

  # Core identity
  validates :email, presence: true, uniqueness: { case_sensitive: false }, allow_blank: false
  validates :firebase_uid, uniqueness: true, allow_nil: true
  validates :username, uniqueness: { case_sensitive: false }, allow_nil: true

  before_validation :normalize_email

  # If you want to optionally allow pure local (non-Firebase) accounts later, you can
  # re-enable password rules conditionally by uncommenting the below:
  #
  # validates :password, presence: true, length: { minimum: 8 }, if: :requires_local_password?
  # def requires_local_password?
  #   firebase_uid.blank? && provider.blank?
  # end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end
end