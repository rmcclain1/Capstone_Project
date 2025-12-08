class AddFieldsToPantries < ActiveRecord::Migration[8.0]
  def change
    add_column :pantries, :image_url, :string unless column_exists?(:pantries, :image_url)
    add_column :pantries, :quantity,  :integer, default: 1, null: false unless column_exists?(:pantries, :quantity)
    add_column :pantries, :source,    :string  unless column_exists?(:pantries, :source)

    add_index :pantries, :user_id unless index_exists?(:pantries, :user_id)
  end
end
