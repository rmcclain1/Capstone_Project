class AddQuantityToPantries < ActiveRecord::Migration[8.0]
  def change
    add_column :pantries, :quantity, :integer, default: 0, null: false
    add_index  :pantries, :quantity
  end
end