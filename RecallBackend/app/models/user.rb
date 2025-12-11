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
  
  # ========================================
  # FIX: Add allow_blank to prevent empty string validation errors
  # ========================================
  validates :email, 
    uniqueness: { case_sensitive: false }, 
    allow_nil: true, 
    allow_blank: true  # ← ADDED THIS
    
  validates :username, 
    uniqueness: { case_sensitive: false }, 
    allow_nil: true, 
    allow_blank: true  # ← ADDED THIS
    
  validates :expo_push_token, 
    uniqueness: true, 
    allow_nil: true, 
    allow_blank: true  # ← ADDED THIS

  before_validation :normalize_email
  before_save :normalize_empty_strings  # ← ADDED THIS

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
    base = super(options).merge(
      'display_name' => display_name,
      'initials' => initials,
      'has_organizations' => organizations.any?,
      'organization_count' => organizations.count,
      'pending_invitations_count' => pending_invitations.count
    )
    
    # Add phone_number field for mobile app compatibility
    # Handle both phone_number and phonenumber column names
    if has_attribute?(:phone_number)
      base['phone_number'] = phone_number
    elsif has_attribute?(:phonenumber)
      base['phone_number'] = phonenumber
    end
    
    # Add profile_picture_url (with avatar_url alias for mobile)
    if has_attribute?(:profile_picture_url)
      base['profile_picture_url'] = profile_picture_url
      base['avatar_url'] = profile_picture_url  # Alias
    elsif has_attribute?(:avatar_url)
      # Database has avatar_url column (from Firebase/Google login)
      # Prefer ActiveStorage avatar if attached, otherwise use database URL

      if avatar.attached?

        storage_url = Rails.application.routes.url_helpers.rails_blob_url(avatar, only_path: true) rescue nil

        base['avatar_url'] = storage_url

        base['profile_picture_url'] = storage_url

      else

        # Use database URL (Google/Firebase avatar)

        base['avatar_url'] = avatar_url

        base['profile_picture_url'] = avatar_url

      end
    end
    
    # Add allergies if column exists
    if has_attribute?(:allergies)
      base['allergies'] = parse_allergies
    end
    
    base
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase if email.present?
  end

  # ========================================
  # NEW: Normalize empty strings to nil
  # ========================================
  # This prevents validation errors when mobile app sends "" instead of null
  def normalize_empty_strings
    attributes.each do |key, value|
      # Skip firebase_uid since it's required
      next if key == 'firebase_uid'
      
      if value.is_a?(String) && value.strip.empty?
        self[key] = nil
      end
    end
  end

  # Parse allergies from JSON string to array for API responses
  def parse_allergies
    return nil if allergies.blank?
    
    case allergies
    when Array
      allergies
    when String
      begin
        JSON.parse(allergies)
      rescue JSON::ParserError
        allergies.split(',').map(&:strip).reject(&:blank?)
      end
    else
      nil
    end
  end
end