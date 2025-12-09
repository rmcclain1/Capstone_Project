
class AddOrganizationToPantries < ActiveRecord::Migration[7.0]
  def change
    # Add foreign keys if they don't exist
    unless column_exists?(:pantries, :organization_id)
      add_reference :pantries, :organization, foreign_key: true
    end
    
    unless column_exists?(:pantries, :added_by_user_id)
      add_reference :pantries, :added_by_user, foreign_key: { to_table: :users }
    end
    
    # Only add columns if they don't exist
    unless column_exists?(:pantries, :location)
      add_column :pantries, :location, :string
    end
    
    unless column_exists?(:pantries, :batch_number)
      add_column :pantries, :batch_number, :string
    end
    
    unless column_exists?(:pantries, :lot_number)
      add_column :pantries, :lot_number, :string
    end
    
    unless column_exists?(:pantries, :notes)
      add_column :pantries, :notes, :text
    end
    
    # Only add indexes if they don't exist
    unless index_exists?(:pantries, [:organization_id, :item_name])
      add_index :pantries, [:organization_id, :item_name]
    end
    
    unless index_exists?(:pantries, :added_by_user_id)
      add_index :pantries, :added_by_user_id
    end
  end
end