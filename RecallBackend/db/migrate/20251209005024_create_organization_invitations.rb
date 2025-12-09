
class CreateOrganizationInvitations < ActiveRecord::Migration[7.0]
  def change
    create_table :organization_invitations do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :email, null: false
      t.string :role, default: 'member'
      t.string :token, null: false
      t.string :status, default: 'pending' # 'pending', 'accepted', 'declined', 'expired'
      t.datetime :expires_at
      
      t.timestamps
    end
    
    add_index :organization_invitations, :token, unique: true
    add_index :organization_invitations, :email
    add_index :organization_invitations, :status
  end
end