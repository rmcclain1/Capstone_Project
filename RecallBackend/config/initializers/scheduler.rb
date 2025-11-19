require 'rufus-scheduler'
scheduler = Rufus::Scheduler.new

scheduler.cron '5 0 * * *' do
  ExpiringPantryNotifier.call(days_ahead: 0)
end
