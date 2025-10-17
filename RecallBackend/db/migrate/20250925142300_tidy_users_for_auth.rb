class TidyUsersForAuth < ActiveRecord::Migration[8.0]
  def change
    # Remove plain password column if it exists
    remove_column :users, :password, :string if column_exists?(:users, :password)

    # Ensure password_digest exists
    add_column :users, :password_digest, :string unless column_exists?(:users, :password_digest)

    # Add uniqueness indexes
    add_index :users, :email, unique: true unless index_exists?(:users, :email)
    add_index :users, :username, unique: true unless index_exists?(:users, :username)
  end
end
