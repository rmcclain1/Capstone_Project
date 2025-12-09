# app/models/organization.rb
class Organization < ApplicationRecord
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :pantries, dependent: :destroy
  has_many :organization_invitations, dependent: :destroy
  has_many :organization_activities, dependent: :destroy
  
  validates :name, presence: true, length: { maximum: 100 }
  validates :organization_type, inclusion: { 
    in: %w[restaurant store warehouse cafe bakery other],
    allow_nil: true 
  }
  
  scope :active, -> { where(active: true) }
  
  # Get all members with their roles
  def members_with_roles
    organization_memberships.includes(:user).active
  end
  
  # Get owners
  def owners
    users.joins(:organization_memberships)
      .where(organization_memberships: { role: 'owner', status: 'active' })
  end
  
  # Get managers
  def managers
    users.joins(:organization_memberships)
      .where(organization_memberships: { role: 'manager', status: 'active' })
  end
  
  # Check if at member limit
  def at_member_limit?
    members_with_roles.count >= member_limit
  end
  
  # Total items in organization pantry
  def total_items
    pantries.sum(:quantity)
  end
  
  # Items expiring soon (next 3 days)
  def expiring_soon_count
    pantries.where('expiration_date <= ?', 3.days.from_now)
      .where('expiration_date > ?', Date.current)
      .count
  end
  
  # Log activity
  def log_activity(user:, action:, resource: nil, metadata: {})
    organization_activities.create!(
      user: user,
      action: action,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      metadata: metadata
    )
  end
end