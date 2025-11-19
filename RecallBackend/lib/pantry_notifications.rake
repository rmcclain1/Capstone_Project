# lib/tasks/pantry_notifications.rake
namespace :pantry do
  desc "Send notifications for items expiring soon or expired"
  task notify_expiring: :environment do
    today = Date.current
    week_from_now = today + 7.days

    # Find items expiring within 7 days that haven't been notified yet
    Pantry.where(expiration_date: today..week_from_now)
          .where(expired: [false, nil])
          .find_each do |item|
      user = item.user
      next unless user

      days_until_expiration = (item.expiration_date - today).to_i
      
      message = if days_until_expiration == 0
        "#{item.item_name} expires today!"
      elsif days_until_expiration == 1
        "#{item.item_name} expires tomorrow!"
      else
        "#{item.item_name} expires in #{days_until_expiration} days"
      end

      # Create notification (this will automatically send push)
      user.notifications.create!(
        title: "Pantry Item Expiring",
        message: message
      )
    end

    # Mark items as expired
    Pantry.where(expiration_date: ...today)
          .where(expired: [false, nil])
          .update_all(expired: true)
  end
end