# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_01_203336) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "food_events", force: :cascade do |t|
    t.string "event_id"
    t.string "recall_number"
    t.string "status"
    t.string "recalling_firm"
    t.string "address_1"
    t.string "address_2"
    t.string "city"
    t.string "state"
    t.string "postal_code"
    t.string "country"
    t.string "classification"
    t.string "voluntary_mandated"
    t.text "initial_firm_notification"
    t.text "distribution_pattern"
    t.text "product_description"
    t.string "product_quantity"
    t.string "reason_for_recall"
    t.string "product_type"
    t.date "recall_initiation_date"
    t.date "center_classification_date"
    t.date "report_date"
    t.string "code_info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_food_events_on_event_id"
  end

  create_table "pantries", force: :cascade do |t|
    t.integer "user_id"
    t.string "item_name"
    t.string "expiration_date"
    t.string "bestby_date"
    t.string "manufacturer"
    t.integer "lot_number"
    t.string "country_of_origin"
    t.string "allergen"
    t.boolean "expired"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "username", limit: 255, null: false
    t.string "password_digest", limit: 255, null: false
    t.string "first_name", limit: 255
    t.string "last_name", limit: 255
    t.string "email", limit: 255, null: false
    t.date "birthday"
    t.bigint "phonenumber"
    t.datetime "created_at", precision: nil, default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", precision: nil, default: -> { "CURRENT_TIMESTAMP" }, null: false

    t.unique_constraint ["email"], name: "users_email_key"
    t.unique_constraint ["username"], name: "users_username_key"
  end
end
