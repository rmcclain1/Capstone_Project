require Rails.root.join('app/services/food_event_importer')
require 'rufus-scheduler'

scheduler = Rufus::Scheduler.new

# update recall db on server start
Thread.new do
  puts "[FoodEventImporter] Running on server start..."
  begin
    FoodEventImporter.call
    puts "[FoodEventImporter] Completed successfully."
  rescue => e
    puts "[FoodEventImporter] Failed: #{e.message}"
  end
end

# update recall db at 2am daily
scheduler.cron '0 2 * * *' do
  puts "[FoodEventImporter] Running scheduled update..."
  begin
    FoodEventImporter.call
    puts "[FoodEventImporter] Completed successfully."
  rescue => e
    puts "[FoodEventImporter] Failed: #{e.message}"
  end
end