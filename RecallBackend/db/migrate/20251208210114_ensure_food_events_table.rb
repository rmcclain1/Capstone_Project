# db/migrate/XXXXXXXXXXXXXX_ensure_food_events_table.rb
class EnsureFoodEventsTable < ActiveRecord::Migration[8.0]
  def change
    # Create table if it doesn't exist yet
    create_table :food_events, if_not_exists: true do |t|
      t.string  :event_id
      t.string  :recall_number
      t.string  :product_description
      t.string  :code_info
      t.string  :recalling_firm
      t.string  :status
      t.string  :classification
      t.string  :state
      t.string  :distribution_pattern
      t.date    :report_date
      t.date    :recall_initiation_date
      t.text    :reason_for_recall
      t.jsonb   :raw_data, default: {}

      t.timestamps
    end

    # Indices (add only if missing to keep this migration safe to re-run)
    add_index :food_events, :event_id, unique: true unless index_exists?(:food_events, :event_id)
    add_index :food_events, :recall_number unless index_exists?(:food_events, :recall_number)
    add_index :food_events, :status        unless index_exists?(:food_events, :status)
    add_index :food_events, :classification unless index_exists?(:food_events, :classification)
    add_index :food_events, :state         unless index_exists?(:food_events, :state)
    add_index :food_events, :report_date   unless index_exists?(:food_events, :report_date)
  end
end
