# app/models/pantry.rb
class Pantry < ApplicationRecord
  belongs_to :user

  validates :item_name, presence: true
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :by_user, ->(uid) { where(user_id: uid) }
  scope :q, ->(term) {
    next all if term.blank?
    where(
      "item_name ILIKE :t OR manufacturer ILIKE :t OR category ILIKE :t OR country_of_origin ILIKE :t OR allergen ILIKE :t",
      t: "%#{sanitize_sql_like(term)}%"
    )
  }
  scope :category_is, ->(c) { where(category: c) if c.present? }
  scope :expired_is,  ->(b) { where(expired: ActiveModel::Type::Boolean.new.cast(b)) unless b.nil? }
  scope :allergen_is, ->(a) { where(allergen: a) if a.present? }
  scope :country_is,  ->(c) { where(country_of_origin: c) if c.present? }
  scope :manufacturer_is, ->(m) { where(manufacturer: m) if m.present? }
  scope :lot_between, ->(from, to) {
    rel = all
    rel = rel.where("lot_number >= ?", from) if from.present?
    rel = rel.where("lot_number <= ?", to)   if to.present?
    rel
  }

  scope :bestby_between, ->(from, to) {
    rel = all
    rel = rel.where("bestby_date >= ?", from) if from.present?
    rel = rel.where("bestby_date <= ?", to)   if to.present?
    rel
  }
  scope :exp_between, ->(from, to) {
    rel = all
    rel = rel.where("expiration_date >= ?", from) if from.present?
    rel = rel.where("expiration_date <= ?", to)   if to.present?
    rel
  }

  SORTS = {
    "name_asc"  => "item_name ASC",
    "name_desc" => "item_name DESC",
    "exp_asc"   => "expiration_date ASC NULLS LAST",
    "exp_desc"  => "expiration_date DESC NULLS LAST",
    "newest"    => "created_at DESC",
    "oldest"    => "created_at ASC",
    "qty_desc"  => "quantity DESC NULLS LAST",
    "qty_asc"   => "quantity ASC NULLS LAST",
  }.freeze
  scope :sorted, ->(key) { order(SORTS[key].presence || SORTS["newest"]) }
end
