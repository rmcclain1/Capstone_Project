class AddVoluntaryMandatedToFoodEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :food_events, :voluntary_mandated, :string unless column_exists?(:food_events, :voluntary_mandated)
  end
end
