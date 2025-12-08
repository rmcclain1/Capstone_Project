class AddExpoPushTokenToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :expo_push_token, :string unless column_exists?(:users, :expo_push_token)
    add_index  :users, :expo_push_token          unless index_exists?(:users, :expo_push_token)
  end
end
