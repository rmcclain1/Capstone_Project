
class FixPantryQuantityDefault < ActiveRecord::Migration[8.0]
  def up
    change_column_default :pantries, :quantity, from: nil, to: 1
    
    # Update existing records with NULL quantity
    execute "UPDATE pantries SET quantity = 1 WHERE quantity IS NULL"
    
    # Make it NOT NULL
    change_column_null :pantries, :quantity, false, 1
  end

  def down
    change_column_null :pantries, :quantity, true
    change_column_default :pantries, :quantity, from: 1, to: nil
  end
end