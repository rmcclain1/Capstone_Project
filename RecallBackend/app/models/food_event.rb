class FoodEvent < ApplicationRecord
  validates :event_id, presence: true

  after_commit :notify_users, on: :create

    private

    def notify_users
      User.where.not(expo_push_token: nil).find_each do |user|
        ExpoPushService.send_to(
          user,
          title: "New recall: #{title}",
          body: issuer.present? ? "Issued by #{issuer}" : "A new recall was posted."
        )
      end
    end
end