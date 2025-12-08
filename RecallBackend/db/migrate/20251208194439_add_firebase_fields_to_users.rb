# db/migrate/XXXXXXXXXXXXXX_add_firebase_fields_to_users.rb
class AddFirebaseFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :firebase_uid, :string unless column_exists?(:users, :firebase_uid)
    add_column :users, :provider, :string unless column_exists?(:users, :provider)
    add_column :users, :avatar_url, :string unless column_exists?(:users, :avatar_url)

    add_index :users, :firebase_uid, unique: true unless index_exists?(:users, :firebase_uid)
  end
end
