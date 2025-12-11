# app/models/pantry.rb
class Pantry < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :organization, optional: true
  belongs_to :added_by_user, class_name: 'User', optional: true

  validates :item_name, presence: true
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :must_belong_to_user_or_organization

  after_commit :create_expiration_notifications, on: [:create, :update]
  after_commit :check_for_recall_matches, on: :create

  # ============================================================================
  # Scopes - Original (Personal Pantry)
  # ============================================================================
  
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

  # ============================================================================
  # Scopes - (Organization Support)
  # ============================================================================
  
  # Get personal pantry items (no organization)
  scope :personal, -> { where(organization_id: nil) }
  
  # Get organization pantry items
  scope :for_organization, ->(org) { where(organization: org) }
  
  # Get items added by specific user (in organization context)
  scope :added_by, ->(user) { where(added_by_user: user) }
  
  # Get items expiring soon
  scope :expiring_soon, ->(days = 3) { 
    where('expiration_date <= ? AND expiration_date > ?', days.days.from_now, Date.current) 
  }
  
  # Get expired items
  scope :expired, -> { where('expiration_date < ?', Date.current) }
  
  # Get items by location (for organizations)
  scope :by_location, ->(location) { where(location: location) if location.present? }

  # ============================================================================
  # Callbacks
  # ============================================================================
  
  after_create :log_organization_activity, if: :organization_id?
  after_update :log_organization_update, if: :organization_id?
  after_destroy :log_organization_deletion, if: :organization_id?

  # ============================================================================
  # Instance Methods
  # ============================================================================
  
  # Get the name of who added this item
  def owner_name
    added_by_user&.display_name || user&.display_name || 'Unknown'
  end
  
  # Get initials of who added this item
  def owner_initials
    added_by_user&.initials || user&.initials || 'U'
  end
  
  # Check if item is expiring soon
  def expiring_soon?(days = 3)
    return false unless expiration_date.present?
    expiration_date <= days.days.from_now && expiration_date > Date.current
  end
  
  # Check if item is expired
  def expired?
    return false unless expiration_date.present?
    expiration_date < Date.current
  end
  
  # Get days until expiration
  def days_until_expiration
    return nil unless expiration_date.present?
    (expiration_date - Date.current).to_i
  end
  
  # Check if this is an organization item
  def organization_item?
    organization_id.present?
  end
  
  # Check if this is a personal item
  def personal_item?
    organization_id.nil?
  end

  # ============================================================================
  # Serialization
  # ============================================================================
  
  def as_json(options = {})
    super(options).merge(
      'owner_name' => owner_name,
      'owner_initials' => owner_initials,
      'expiring_soon' => expiring_soon?,
      'expired' => expired?,
      'days_until_expiration' => days_until_expiration,
      'is_organization_item' => organization_item?
    )
  end

  private

  # ============================================================================
  # Validations
  # ============================================================================
  
  def must_belong_to_user_or_organization
    if user_id.blank? && organization_id.blank?
      errors.add(:base, 'Must belong to either a user or organization')
    end
    
    if user_id.present? && organization_id.present?
      errors.add(:base, 'Cannot belong to both user and organization')
    end
  end

  # ============================================================================
  # Activity Logging
  # ============================================================================
  
  def log_organization_activity
    return unless organization.present?
    
    organization.log_activity(
      user: added_by_user,
      action: 'added_item',
      resource: self,
      metadata: {
        item_name: item_name,
        quantity: quantity,
        location: location
      }
    )
  end
  
  def log_organization_update
    return unless organization.present?
    return unless saved_changes.except('updated_at').any?
    
    organization.log_activity(
      user: added_by_user,
      action: 'updated_item',
      resource: self,
      metadata: {
        item_name: item_name,
        changes: saved_changes.except('updated_at')
      }
    )
  end
  
  def log_organization_deletion
    return unless organization.present?
    
    organization.log_activity(
      user: added_by_user,
      action: 'deleted_item',
      resource: nil,
      metadata: {
        item_name: item_name,
        quantity: quantity
      }
    )
  end
  # ----------------------------------------------------------------------------
  # Notification helpers
  # ----------------------------------------------------------------------------

  # Who should receive notifications for this pantry item?
  def notification_owner
    if personal_item?
      user
    elsif organization_item?
      # Prefer the user who added it, then an owner, then any org member
      added_by_user ||
        organization&.owners&.first ||
        organization&.users&.first
    end
  end

  # Create or update notifications when expiration info changes
  def create_expiration_notifications
    return unless expiration_date.present?

    recipient = notification_owner
    return unless recipient

    days = days_until_expiration
    return if days.nil?

    # Clear old expiration-related notifications for this item
    Notification.where(
      user: recipient,
      pantry: self,
      notification_type: [
        Notification::TYPES[:expiring_soon],
        Notification::TYPES[:expiring_today],
        Notification::TYPES[:expired]
      ]
    ).delete_all

    notification_key =
      if days < 0
        :expired
      elsif days == 0
        :expiring_today
      elsif days <= 3
        :expiring_soon
      else
        nil
      end

    return unless notification_key

    title, body =
      case notification_key
      when :expired
        [
          "Item expired",
          "Your item '#{item_name}' expired on #{expiration_date.to_date}."
        ]
      when :expiring_today
        [
          "Item expires today",
          "Your item '#{item_name}' expires today (#{expiration_date.to_date})."
        ]
      else
        [
          "Item expiring soon",
          "Your item '#{item_name}' will expire on #{expiration_date.to_date}."
        ]
      end

    Notification.create!(
      user: recipient,
      pantry: self,
      notification_type: Notification::TYPES[notification_key],
      title: title,
      body: body,
      metadata: {
        expiration_date: expiration_date,
        days_until_expiration: days,
        days_expired: (days < 0 ? days.abs : 0)
      }
    )
  rescue => e
    Rails.logger.error "Expiration notification failed for pantry #{id}: #{e.class} #{e.message}"
  end

    # Check new items against FDA recalls (name / manufacturer) and notify
  def check_for_recall_matches
    recipient = notification_owner
    return unless recipient

    # Build search terms from item name + manufacturer
    terms = []
    terms << item_name.to_s.strip if item_name.present?
    terms << manufacturer.to_s.strip if respond_to?(:manufacturer) && manufacturer.present?
    terms = terms.map { |t| t.downcase }.uniq.reject(&:blank?)
    return if terms.empty?

    # Build query: any event whose title, product_description, or recalling_firm
    # contains ANY of the terms (case-insensitive)
    query = FoodEvent.none

    terms.each do |term|
      safe_term = ActiveRecord::Base.sanitize_sql_like(term)
      pattern   = "%#{safe_term}%"

      scope = FoodEvent.where(
        "food_events.title ILIKE :pattern
         OR food_events.product_description ILIKE :pattern
         OR food_events.recalling_firm ILIKE :pattern",
        pattern: pattern
      )

      query = query.or(scope)
    end

    matches = query.limit(5)

    matches.each do |event|
      # Avoid duplicate notifications for the same pantry + event
      already_exists = Notification
        .where(
          user: recipient,
          pantry: self,
          notification_type: Notification::TYPES[:custom]
        )
        .where("metadata ->> 'food_event_id' = ?", event.id.to_s)
        .exists?

      next if already_exists

      Notification.create!(
        user: recipient,
        pantry: self,
        notification_type: Notification::TYPES[:custom], # TS already knows "custom"
        title: "Possible recall: #{event.title.presence || item_name}",
        body: "Your item '#{item_name}' may match an FDA recall from #{event.recalling_firm}. Check details to confirm if your product is affected.",
        metadata: {
          source: "recall_match",
          food_event_id: event.id,
          recall_number: event.event_id,
          product_description: event.product_description,
          recalling_firm: event.recalling_firm,
          status: event.status
        }
      )
    end
  rescue => e
    Rails.logger.error "Recall match notification failed for pantry #{id}: #{e.class} #{e.message}"
  end
end 