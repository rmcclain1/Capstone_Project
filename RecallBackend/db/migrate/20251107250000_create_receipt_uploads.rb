class CreateReceiptUploads < ActiveRecord::Migration[8.0]
  def change
    create_table :receipt_uploads, id: :uuid do |t|
      t.integer :user_id, index: true
      t.string  :status, default: 'processing', null: false
      t.string  :vendor
      t.datetime :purchased_at
      t.integer :total_cents
      t.jsonb  :items, default: [] # [{ raw, qty, name, matched: { upc, name, brand }, confidence }]
      t.timestamps
    end
  end
end