# app/models/user.rb
class User < ApplicationRecord
  has_secure_password validations: false

  # Personal pantry
  has_many :pantries, dependent: :destroy
  has_one_attached :avatar

  # Notifications
  has_many :notifications, dependent: :destroy

  # Organization relationships
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships
  has_many :owned_organizations, 
    -> { where(organization_memberships: { role: 'owner' }) }, 
    through: :organization_memberships, 
    source: :organization
  has_many :managed_organizations,
    -> { where(organization_memberships: { role: 'manager' }) },
    through: :organization_memberships,
    source: :organization
  has_many :invited_organizations, 
    class_name: 'OrganizationInvitation', 
    foreign_key: 'invited_by_id'
  has_many :organization_activities, dependent: :nullify

  # Core validations
  validates :firebase_uid, presence: true, uniqueness: true
  validates :email, uniqueness: { case_sensitive: false }, allow_nil: true
  validates :username, uniqueness: { case_sensitive: false }, allow_nil: true
  validates :expo_push_token, uniqueness: true, allow_nil: true

  before_validation :normalize_email

  # ============================================================================
  # Organization Methods
  # ============================================================================

  # Get user's active organizations
  def active_organizations
    organizations.where(
      organization_memberships: { status: 'active' }
    ).where(active: true)
  end

  # Get user's primary/current organization (first active one)
  def current_organization
    organization_memberships.active.first&.organization
  end

  # Get membership for specific organization
  def membership_in(organization)
    organization_memberships.find_by(organization: organization)
  end

  # Check if user is a member of organization
  def member_of?(organization)
    membership_in(organization).present?
  end

  # Check if user can perform action in organization
  def can_in_organization?(organization, action)
    membership = membership_in(organization)
    return false unless membership&.status == 'active'
    membership.can?(action)
  end

  # Get role in organization
  def role_in(organization)
    membership_in(organization)&.role
  end

  # Check if owner of organization
  def owner_of?(organization)
    role_in(organization) == 'owner'
  end

  # Check if manager of organization
  def manager_of?(organization)
    role_in(organization) == 'manager'
  end

  # Get all pending invitations for this user's email
  def pending_invitations
    return [] if email.blank?
    
    OrganizationInvitation
      .where(email: email, status: 'pending')
      .where('expires_at > ?', Time.current)
  end

  # ============================================================================
  # Push Notification Methods
  # ============================================================================

  def push_notifications_enabled?
    push_notifications_enabled && expo_push_token.present?
  end

  def unread_notifications_count
    notifications.unread.count
  end

  # Register or update Expo push token
  def register_push_token(token)
    return if token.blank?
    update(expo_push_token: token) unless expo_push_token == token
  end

  # Unregister push token (on logout)
  def unregister_push_token
    update(expo_push_token: nil)
  end

  # ============================================================================
  # Display Methods
  # ============================================================================

  def display_name
    username.presence || email.presence || "User ##{id}"
  end

  def initials
    if username.present?
      username[0..1].upcase
    elsif email.present?
      email[0..1].upcase
    else
      "U#{id}"[0..1]
    end
  end

  # ============================================================================
  # Serialization
  # ============================================================================

  def as_json(options = {})
    super(options).merge(
      'display_name' => display_name,
      'initials' => initials,
      'has_organizations' => organizations.any?,
      'organization_count' => organizations.count,
      'pending_invitations_count' => pending_invitations.count
    )
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase if email.present?
  end
end