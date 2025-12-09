
class CreateOrganizationMemberships < ActiveRecord::Migration[7.0]
  def change
    create_table :organization_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true
      t.string :role, null: false, default: 'member' # 'owner', 'manager', 'member'
      t.string :status, default: 'active' # 'active', 'invited', 'suspended'
      t.string :title # Job title: 'Manager', 'Staff', etc.
      
      # Permissions
      t.jsonb :permissions, default: {
        can_add_items: true,
        can_delete_items: false,
        can_edit_items: true,
        can_invite_members: false,
        can_manage_recalls: false,
        can_view_reports: false
      }
      
      t.timestamps
    end
    
    add_index :organization_memberships, [:user_id, :organization_id], unique: true
    add_index :organization_memberships, :role
    add_index :organization_memberships, :status
  end
end