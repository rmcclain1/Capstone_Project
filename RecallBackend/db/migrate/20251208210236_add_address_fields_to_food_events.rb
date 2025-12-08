# db/migrate/XXXXXXXXXXXXXX_add_address_fields_to_food_events.rb
class AddAddressFieldsToFoodEvents < ActiveRecord::Migration[8.0]
  def change
    # These match what the importer is trying to set.
    # We guard with column_exists? so this stays safe if you re-run or
    # later pull in a migration that already added some of them.

    add_column :food_events, :address_1, :string unless column_exists?(:food_events, :address_1)
    add_column :food_events, :address_2, :string unless column_exists?(:food_events, :address_2)
    add_column :food_events, :city,       :string unless column_exists?(:food_events, :city)
    add_column :food_events, :postal_code, :string unless column_exists?(:food_events, :postal_code)
    add_column :food_events, :country,    :string unless column_exists?(:food_events, :country)
  end
end
