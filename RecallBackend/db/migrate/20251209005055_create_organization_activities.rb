
class CreateOrganizationActivities < ActiveRecord::Migration[7.0]
  def change
    create_table :organization_activities do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :action # 'added_item', 'deleted_item', 'invited_member', etc.
      t.string :resource_type
      t.bigint :resource_id
      t.jsonb :metadata, default: {}
      
      t.timestamps
    end
    
    add_index :organization_activities, [:organization_id, :created_at]
    add_index :organization_activities, [:resource_type, :resource_id]
  end
end