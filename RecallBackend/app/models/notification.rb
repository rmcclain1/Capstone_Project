# app/models/notification.rb
class Notification < ApplicationRecord
  belongs_to :user

  after_create :send_push_notification

  scope :unread, -> { where(read: false) }
  scope :recent, -> { order(created_at: :desc) }

  private

  def send_push_notification
    ExpoPushService.send_to(
      user,
      title: "Consume Safe",
      body: "You have a new notification in Consume Safe"
    )
  end
end