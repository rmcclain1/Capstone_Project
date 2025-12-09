# app/models/organization_invitation.rb
class OrganizationInvitation < ApplicationRecord
  belongs_to :organization
  belongs_to :invited_by, class_name: 'User'
  
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token, presence: true, uniqueness: true
  validates :role, inclusion: { in: OrganizationMembership::ROLES }
  
  before_validation :generate_token, on: :create
  before_validation :set_expiration, on: :create
  
  scope :pending, -> { where(status: 'pending') }
  scope :expired, -> { where('expires_at < ?', Time.current) }
  
  def expired?
    expires_at < Time.current
  end
  
  def accept!(user)
    return false if expired? || status != 'pending'
    
    transaction do
      membership = organization.organization_memberships.create!(
        user: user,
        role: role,
        status: 'active',
        permissions: OrganizationMembership.default_permissions_for(role)
      )
      
      update!(status: 'accepted')
      
      organization.log_activity(
        user: user,
        action: 'accepted_invitation',
        metadata: { invited_by: invited_by.email, role: role }
      )
      
      membership
    end
  end
  
  def decline!
    update!(status: 'declined')
  end
  
  private
  
  def generate_token
    self.token = SecureRandom.urlsafe_base64(32)
  end
  
  def set_expiration
    self.expires_at = 7.days.from_now
  end
end