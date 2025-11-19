class ExpiringPantryNotifier
  def self.call(days_ahead: 0)
    date = Date.current + days_ahead
    Pantry
      .includes(:user)
      .where(expiration_date: date)
      .find_each do |p|
        user = p.user
        next unless user # sanity
        user.notifications.create!(
          title: "Item expiring",
          body:  "#{p.item_name} expires #{date.strftime('%b %d')}."
        )
      end
  end
end