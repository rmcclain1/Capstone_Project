
class CreateOrganizations < ActiveRecord::Migration[7.0]
  def change
    create_table :organizations do |t|
      t.string :name, null: false
      t.string :organization_type # 'restaurant', 'store', 'warehouse', 'other'
      t.text :description
      t.string :address
      t.string :phone
      t.string :email
      t.integer :member_limit, default: 10
      t.boolean :active, default: true
      
      # Settings
      t.jsonb :settings, default: {
        require_approval: false,
        allow_bulk_entry: true,
        track_who_added: true,
        notification_preferences: {}
      }
      
      t.timestamps
    end
    
    add_index :organizations, :name
    add_index :organizations, :active
  end
end