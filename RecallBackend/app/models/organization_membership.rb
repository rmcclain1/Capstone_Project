# app/models/organization_membership.rb
class OrganizationMembership < ApplicationRecord
  belongs_to :user
  belongs_to :organization
  
  ROLES = %w[owner manager member].freeze
  STATUSES = %w[active invited suspended].freeze
  
  validates :role, inclusion: { in: ROLES }
  validates :status, inclusion: { in: STATUSES }
  validates :user_id, uniqueness: { scope: :organization_id }
  
  scope :active, -> { where(status: 'active') }
  scope :owners, -> { where(role: 'owner') }
  scope :managers, -> { where(role: 'manager') }
  scope :members, -> { where(role: 'member') }
  
  # Check permissions
  def can?(action)
    return true if role == 'owner'
    permissions[action.to_s] == true
  end
  
  def owner?
    role == 'owner'
  end
  
  def manager?
    role == 'manager'
  end
  
  def member?
    role == 'member'
  end
  
  # Default permissions by role
  def self.default_permissions_for(role)
    case role.to_s
    when 'owner'
      {
        can_add_items: true,
        can_delete_items: true,
        can_edit_items: true,
        can_invite_members: true,
        can_manage_recalls: true,
        can_view_reports: true,
        can_manage_organization: true
      }
    when 'manager'
      {
        can_add_items: true,
        can_delete_items: true,
        can_edit_items: true,
        can_invite_members: true,
        can_manage_recalls: true,
        can_view_reports: true,
        can_manage_organization: false
      }
    else # member
      {
        can_add_items: true,
        can_delete_items: false,
        can_edit_items: true,
        can_invite_members: false,
        can_manage_recalls: false,
        can_view_reports: false,
        can_manage_organization: false
      }
    end
  end
end