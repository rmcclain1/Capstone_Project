class AddImageUrlToPantries < ActiveRecord::Migration[8.0]
  def change
    add_column :pantries, :image_url, :string
  end
end
