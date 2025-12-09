class ChangePhoneNumberToString < ActiveRecord::Migration[7.0]
  def up
    # Change column from integer to string
    change_column :users, :phone_number, :string
  end

  def down
    # Allow rollback (but will lose data if strings have non-numeric chars)
    change_column :users, :phone_number, :integer
  end
end