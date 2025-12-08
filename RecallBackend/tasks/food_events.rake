# lib/tasks/food_events.rake
namespace :food_events do
  desc "Import FDA food enforcement events from bulk ZIP"
  task import: :environment do
    puts "[food_events:import] Starting…"
    FoodEventImporter.call
    puts "[food_events:import] Done."
  end
end
