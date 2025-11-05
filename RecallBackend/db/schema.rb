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

ActiveRecord::Schema[8.0].define(version: 2025_10_24_160000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "pantries", force: :cascade do |t|
    t.integer "user_id"
    t.string "item_name"
    t.date "expiration_date"
    t.date "bestby_date"
    t.string "manufacturer"
    t.integer "lot_number"
    t.string "country_of_origin"
    t.string "allergen"
    t.boolean "expired"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "quantity"
    t.string "image_url"
    t.index ["bestby_date"], name: "index_pantries_on_bestby_date"
    t.index ["created_at"], name: "index_pantries_on_created_at"
    t.index ["expiration_date"], name: "index_pantries_on_expiration_date"
    t.index ["user_id", "category"], name: "index_pantries_on_user_id_and_category"
    t.index ["user_id", "expired"], name: "index_pantries_on_user_id_and_expired"
    t.index ["user_id", "item_name"], name: "index_pantries_on_user_id_and_item_name"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.string "password"
    t.string "first_name"
    t.string "last_name"
    t.string "email"
    t.string "birthday"
    t.bigint "phone_number"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password_digest"
    t.string "location"
    t.string "allergies"
    t.string "firebase_uid"
    t.string "provider"
    t.string "avatar_url"
    t.index ["firebase_uid"], name: "index_users_on_firebase_uid", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
end
