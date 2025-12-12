# app/models/notification.rb
class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :pantry, optional: true

  after_create :send_push_notification, if: -> { user&.expo_push_token.present? }

  # Scopes
  scope :unread, -> { where(read: false) }
  scope :archived, -> { where(archived: true) }
  scope :active, -> { where(archived: false) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(notification_type: type) }

  # Notification types
  TYPES = {
    expiring_soon: 'expiring_soon',
    expiring_today: 'expiring_today',
    expired: 'expired',
    low_stock: 'low_stock',
    custom: 'custom'
  }.freeze

  validates :title, :body, presence: true
  validates :notification_type, inclusion: { in: TYPES.values }, allow_nil: true

  def mark_as_read!
    update!(read: true)
  end

  def archive!
    update!(archived: true, read: true) # Archiving also marks as read
  end

  def unarchive!
    update!(archived: false)
  end

  def as_json(options = {})
    super(options).merge(
      'pantry_item' => pantry&.as_json(only: [:id, :item_name, :expiration_date])
    )
  end

  private

  def send_push_notification
    return unless user.expo_push_token.present?

    ExpoPushService.send_notification(
      token: user.expo_push_token,
      title: title,
      body: body,
      data: {
        notification_id: id,
        notification_type: notification_type,
        pantry_id: pantry_id,
        screen: 'notifications'
      }
    )
  rescue => e
    Rails.logger.error "Failed to send push notification: #{e.message}"
  end
end