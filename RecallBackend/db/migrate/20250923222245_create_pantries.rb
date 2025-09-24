class CreatePantries < ActiveRecord::Migration[8.0]
  def change
    create_table :pantries do |t|
      t.integer :item_id
      t.integer :user_id
      t.string :item_name
      t.string :expiration_date
      t.string :bestby_date
      t.string :manufacturer
      t.integer :lot_number
      t.string :country_of_origin
      t.string :allergen
      t.boolean :expired
      t.string :category

      t.timestamps
    end
  end
end
