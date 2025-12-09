# config/initializers/rufus_scheduler.rb
require 'rufus-scheduler'

# Only run scheduler in specific environments and processes
# Prevents duplicate scheduling if you have multiple Rails processes
scheduler_enabled = ENV.fetch('ENABLE_SCHEDULER', Rails.env.development? || Rails.env.production?)

if scheduler_enabled && !defined?(Rails::Console) && !Rails.env.test?
  scheduler = Rufus::Scheduler.new

  # Check for expiring items daily at 9:00 AM
  scheduler.cron '0 9 * * *' do
    Rails.logger.info '⏰ Running daily expiration check at 9:00 AM'
    
    begin
      ExpiringPantryNotifier.run_daily_check
      Rails.logger.info '✅ Daily expiration check completed'
    rescue => e
      Rails.logger.error "❌ Daily expiration check failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end
  end

  # Optional: Run a lighter check in the afternoon (2:00 PM)
  scheduler.cron '0 14 * * *' do
    Rails.logger.info '⏰ Running afternoon expiration check at 2:00 PM'
    
    begin
      # Only check items expiring today (lighter operation)
      ExpiringPantryNotifier.notify_expiring_today
      Rails.logger.info '✅ Afternoon expiration check completed'
    rescue => e
      Rails.logger.error "❌ Afternoon expiration check failed: #{e.message}"
    end
  end

  # Optional: Evening reminder at 6:00 PM for items expiring today
  scheduler.cron '0 18 * * *' do
    Rails.logger.info '⏰ Running evening reminder at 6:00 PM'
    
    begin
      ExpiringPantryNotifier.notify_expiring_today
      Rails.logger.info '✅ Evening reminder completed'
    rescue => e
      Rails.logger.error "❌ Evening reminder failed: #{e.message}"
    end
  end

  # Clean up old archived notifications every Sunday at midnight
  scheduler.cron '0 0 * * 0' do
    Rails.logger.info '⏰ Running weekly notification cleanup'
    
    begin
      # Delete archived notifications older than 30 days
      count = Notification.archived.where('created_at < ?', 30.days.ago).delete_all
      Rails.logger.info "✅ Deleted #{count} old archived notifications"
    rescue => e
      Rails.logger.error "❌ Notification cleanup failed: #{e.message}"
    end
  end

  Rails.logger.info '✅ Rufus Scheduler initialized successfully'
  Rails.logger.info "📅 Scheduled jobs: #{scheduler.jobs.count}"
  scheduler.jobs.each do |job|
    Rails.logger.info "  - #{job.original} (#{job.class.name})"
  end
end