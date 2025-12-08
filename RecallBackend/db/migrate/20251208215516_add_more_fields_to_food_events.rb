class AddMoreFieldsToFoodEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :food_events, :initial_firm_notification, :string unless column_exists?(:food_events, :initial_firm_notification)
    add_column :food_events, :product_quantity, :string            unless column_exists?(:food_events, :product_quantity)
    add_column :food_events, :product_type, :string                unless column_exists?(:food_events, :product_type)
    add_column :food_events, :center_classification_date, :date    unless column_exists?(:food_events, :center_classification_date)
  end
end
