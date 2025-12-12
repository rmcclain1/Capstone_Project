# app/services/expiring_pantry_notifier.rb
class ExpiringPantryNotifier
  def self.run_daily_check
    Rails.logger.info "Starting daily expiration check..."
    
    # Check items expiring in the next 3 days
    notify_expiring_soon(days: 3)
    
    # Check items expiring today
    notify_expiring_today
    
    # Check already expired items
    notify_expired_items
  end

  def self.notify_expiring_soon(days: 3)
    pantries = Pantry.where('expiration_date <= ? AND expiration_date > ?', 
                            days.days.from_now, Date.current)
    
    pantries.find_each do |pantry|
      pantry.create_expiration_notifications
    end
    
    Rails.logger.info "Checked #{pantries.count} items expiring in #{days} days"
  end

  def self.notify_expiring_today
    pantries = Pantry.where('expiration_date = ?', Date.current)
    
    pantries.find_each do |pantry|
      pantry.create_expiration_notifications
    end
    
    Rails.logger.info "Checked #{pantries.count} items expiring today"
  end

  def self.notify_expired_items
    pantries = Pantry.where('expiration_date < ?', Date.current)
                    .where('expiration_date >= ?', 7.days.ago)
    
    pantries.find_each do |pantry|
      pantry.create_expiration_notifications
    end
    
    Rails.logger.info "Checked #{pantries.count} expired items"
  end
end
