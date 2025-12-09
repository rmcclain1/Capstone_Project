# db/migrate/YYYYMMDDHHMMSS_remove_password_column_and_make_fields_nullable.rb
class RemovePasswordColumnAndMakeFieldsNullable < ActiveRecord::Migration[8.0]
  def change
    # Remove the old plain password column (security issue!)
    remove_column :users, :password, :string if column_exists?(:users, :password)
    
    # Make email and password_digest nullable for Firebase users
    change_column_null :users, :email, true if column_exists?(:users, :email)
    change_column_null :users, :password_digest, true if column_exists?(:users, :password_digest)
    
    # Update email index to allow nulls
    if index_exists?(:users, :email, unique: true)
      remove_index :users, :email
      add_index :users, :email, unique: true, where: "email IS NOT NULL"
    end
  end
end