namespace :pantry do
  desc "Send notifications for items that just expired today"
  task notify_expired: :environment do
    today = Date.current

    Pantry.where(expiration_date: today, expired: [false, nil]).find_each do |item|
      user = item.user
      next unless user

      # mark expired
      item.update(expired: true)

      ExpoPushService.send_to(
        user,
        title: "Pantry item expired",
        body: "#{item.item_name} expired today."
      )
    end
  end
end
