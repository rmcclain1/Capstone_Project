class FoodEvent < ApplicationRecord
  validates :event_id, presence: true

  after_commit :notify_users, on: :create

  private

  def notify_users
    User.where.not(expo_push_token: nil).find_each do |user|
      ExpoPushService.send_to(
        user,
        title: "New recall: #{product_description || 'Food Product'}",
        body: recalling_firm.present? ? "Issued by #{recalling_firm}" : "A new recall was posted."
      )
    end
  rescue => e
    Rails.logger.error "Failed to notify users about food event #{id}: #{e.class} #{e.message}"
  end
end
