# db/migrate/XXXXXXXXXX_change_pantry_dates_and_add_indexes.rb
class ChangePantryDatesAndAddIndexes < ActiveRecord::Migration[8.0]
  def up
    # If strings are already in 'YYYY-MM-DD', this is safe.
    change_column :pantries, :expiration_date, :date, using: "TO_DATE(NULLIF(expiration_date,''), 'YYYY-MM-DD')"
    change_column :pantries, :bestby_date,     :date, using: "TO_DATE(NULLIF(bestby_date,''),     'YYYY-MM-DD')"

    add_index :pantries, [:user_id, :item_name]
    add_index :pantries, [:user_id, :category]
    add_index :pantries, [:user_id, :expired]
    add_index :pantries, :expiration_date
    add_index :pantries, :bestby_date
    add_index :pantries, :created_at
  end

  def down
    change_column :pantries, :expiration_date, :string
    change_column :pantries, :bestby_date,     :string

    remove_index :pantries, column: [:user_id, :item_name]
    remove_index :pantries, column: [:user_id, :category]
    remove_index :pantries, column: [:user_id, :expired]
    remove_index :pantries, column: :expiration_date
    remove_index :pantries, column: :bestby_date
    remove_index :pantries, column: :created_at
  end
end
