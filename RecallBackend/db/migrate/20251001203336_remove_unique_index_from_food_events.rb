class RemoveUniqueIndexFromFoodEvents < ActiveRecord::Migration[6.1]
  def change
    remove_index :food_events, :event_id if index_exists?(:food_events, :event_id)
    add_index :food_events, :event_id # regular index, not unique
  end
end