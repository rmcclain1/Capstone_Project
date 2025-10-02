class AddAllergiesToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :allergies, :string
  end
end
