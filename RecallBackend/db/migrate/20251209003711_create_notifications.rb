
class CreateNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :pantry, null: true, foreign_key: true
      
      t.string :title, null: false
      t.text :body, null: false
      t.boolean :read, default: false, null: false
      t.boolean :archived, default: false, null: false  # Already included!
      t.string :notification_type
      t.jsonb :metadata, default: {}
      
      t.timestamps
    end
    
    add_index :notifications, [:user_id, :read]
    add_index :notifications, [:user_id, :archived]
    add_index :notifications, :created_at
    add_index :notifications, :notification_type
  end
end