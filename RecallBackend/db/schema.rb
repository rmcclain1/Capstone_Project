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

ActiveRecord::Schema[8.0].define(version: 2025_12_09_053858) do
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

  create_table "food_events", force: :cascade do |t|
    t.string "event_id"
    t.string "recall_number"
    t.string "product_description"
    t.string "code_info"
    t.string "recalling_firm"
    t.string "status"
    t.string "classification"
    t.string "state"
    t.string "distribution_pattern"
    t.date "report_date"
    t.date "recall_initiation_date"
    t.text "reason_for_recall"
    t.jsonb "raw_data", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "address_1"
    t.string "address_2"
    t.string "city"
    t.string "postal_code"
    t.string "country"
    t.string "voluntary_mandated"
    t.string "initial_firm_notification"
    t.string "product_quantity"
    t.string "product_type"
    t.date "center_classification_date"
    t.index ["classification"], name: "index_food_events_on_classification"
    t.index ["event_id"], name: "index_food_events_on_event_id", unique: true
    t.index ["recall_number"], name: "index_food_events_on_recall_number"
    t.index ["report_date"], name: "index_food_events_on_report_date"
    t.index ["state"], name: "index_food_events_on_state"
    t.index ["status"], name: "index_food_events_on_status"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pantry_id"
    t.string "title", null: false
    t.text "body", null: false
    t.boolean "read", default: false, null: false
    t.boolean "archived", default: false, null: false
    t.string "notification_type"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_notifications_on_created_at"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["pantry_id"], name: "index_notifications_on_pantry_id"
    t.index ["user_id", "archived"], name: "index_notifications_on_user_id_and_archived"
    t.index ["user_id", "read"], name: "index_notifications_on_user_id_and_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "organization_activities", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "user_id"
    t.string "action"
    t.string "resource_type"
    t.bigint "resource_id"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "created_at"], name: "index_organization_activities_on_organization_id_and_created_at"
    t.index ["organization_id"], name: "index_organization_activities_on_organization_id"
    t.index ["resource_type", "resource_id"], name: "index_organization_activities_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_organization_activities_on_user_id"
  end

  create_table "organization_invitations", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "invited_by_id", null: false
    t.string "email", null: false
    t.string "role", default: "member"
    t.string "token", null: false
    t.string "status", default: "pending"
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_organization_invitations_on_email"
    t.index ["invited_by_id"], name: "index_organization_invitations_on_invited_by_id"
    t.index ["organization_id"], name: "index_organization_invitations_on_organization_id"
    t.index ["status"], name: "index_organization_invitations_on_status"
    t.index ["token"], name: "index_organization_invitations_on_token", unique: true
  end

  create_table "organization_memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id", null: false
    t.string "role", default: "member", null: false
    t.string "status", default: "active"
    t.string "title"
    t.jsonb "permissions", default: {"can_add_items" => true, "can_edit_items" => true, "can_delete_items" => false, "can_view_reports" => false, "can_invite_members" => false, "can_manage_recalls" => false}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_organization_memberships_on_organization_id"
    t.index ["role"], name: "index_organization_memberships_on_role"
    t.index ["status"], name: "index_organization_memberships_on_status"
    t.index ["user_id", "organization_id"], name: "index_organization_memberships_on_user_id_and_organization_id", unique: true
    t.index ["user_id"], name: "index_organization_memberships_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.string "organization_type"
    t.text "description"
    t.string "address"
    t.string "phone"
    t.string "email"
    t.integer "member_limit", default: 10
    t.boolean "active", default: true
    t.jsonb "settings", default: {"track_who_added" => true, "allow_bulk_entry" => true, "require_approval" => false, "notification_preferences" => {}}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_organizations_on_active"
    t.index ["name"], name: "index_organizations_on_name"
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
    t.integer "quantity", default: 1, null: false
    t.string "image_url"
    t.string "source"
    t.bigint "organization_id"
    t.bigint "added_by_user_id"
    t.string "location"
    t.string "batch_number"
    t.text "notes"
    t.index ["added_by_user_id"], name: "index_pantries_on_added_by_user_id"
    t.index ["bestby_date"], name: "index_pantries_on_bestby_date"
    t.index ["created_at"], name: "index_pantries_on_created_at"
    t.index ["expiration_date"], name: "index_pantries_on_expiration_date"
    t.index ["organization_id", "item_name"], name: "index_pantries_on_organization_id_and_item_name"
    t.index ["organization_id"], name: "index_pantries_on_organization_id"
    t.index ["user_id", "category"], name: "index_pantries_on_user_id_and_category"
    t.index ["user_id", "expired"], name: "index_pantries_on_user_id_and_expired"
    t.index ["user_id", "item_name"], name: "index_pantries_on_user_id_and_item_name"
    t.index ["user_id"], name: "index_pantries_on_user_id"
  end

  create_table "receipt_uploads", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "user_id"
    t.string "status", default: "processing", null: false
    t.string "vendor"
    t.datetime "purchased_at"
    t.integer "total_cents"
    t.jsonb "items", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_receipt_uploads_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.string "first_name"
    t.string "last_name"
    t.string "email"
    t.string "birthday"
    t.string "phone_number"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password_digest"
    t.string "location"
    t.string "allergies"
    t.string "firebase_uid"
    t.string "provider"
    t.string "avatar_url"
    t.string "expo_push_token"
    t.index ["expo_push_token"], name: "index_users_on_expo_push_token"
    t.index ["firebase_uid"], name: "index_users_on_firebase_uid", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "notifications", "pantries"
  add_foreign_key "notifications", "users"
  add_foreign_key "organization_activities", "organizations"
  add_foreign_key "organization_activities", "users"
  add_foreign_key "organization_invitations", "organizations"
  add_foreign_key "organization_invitations", "users", column: "invited_by_id"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "pantries", "organizations"
  add_foreign_key "pantries", "users", column: "added_by_user_id"
end
