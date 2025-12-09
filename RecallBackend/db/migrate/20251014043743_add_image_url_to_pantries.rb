# db/migrate/XXXXXX_add_image_url_to_pantries.rb
class AddImageUrlToPantries < ActiveRecord::Migration[7.0]
  def change
    add_column :pantries, :image_url, :string
    add_column :pantries, :category, :string
  end
end