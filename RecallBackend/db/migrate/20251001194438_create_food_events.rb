class CreateFoodEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :food_events do |t|
      t.string :event_id
      t.string :recall_number
      t.string :status
      t.string :recalling_firm
      t.string :address_1
      t.string :address_2
      t.string :city
      t.string :state
      t.string :postal_code
      t.string :country
      t.string :classification
      t.string :voluntary_mandated
      t.text :initial_firm_notification
      t.text :distribution_pattern
      t.text :product_description
      t.string :product_quantity
      t.string :reason_for_recall
      t.string :product_type
      t.date :recall_initiation_date
      t.date :center_classification_date
      t.date :report_date
      t.string :code_info

      t.timestamps
    end
  end
end
