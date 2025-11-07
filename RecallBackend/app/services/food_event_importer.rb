# app/services/food_event_importer.rb

require 'open-uri'
require 'zip'
require 'json'

class FoodEventImporter
  ZIP_URL = "https://download.open.fda.gov/food/enforcement/food-enforcement-0001-of-0001.json.zip"

  def self.call
    new.call
  end

  def call
    download_and_extract do |json_data|
      import_json_data(json_data)
    end
  end

  private

  def download_and_extract
    file = URI.open(ZIP_URL)

    Zip::File.open_buffer(file) do |zip_file|
      zip_file.each do |entry|
        next unless entry.name.ends_with?(".json")

        json_content = entry.get_input_stream.read
        data = JSON.parse(json_content)
        yield(data)
      end
    end
  end

  def import_json_data(data)
    events = data["results"] || []

    last_date = FoodEvent.maximum(:recall_initiation_date)

    events.each do |event|
      event_date = parse_date(event["recall_initiation_date"])
      next if last_date.present? && event_date <= last_date

      next if FoodEvent.exists?(
        recall_number: event["recall_number"],
        recalling_firm: event["recalling_firm"],
        product_description: event["product_description"]
      )

      FoodEvent.create!(
        event_id: event["event_id"],
        recall_number: event["recall_number"],
        status: event["status"],
        recalling_firm: event["recalling_firm"],
        address_1: event["address_1"],
        address_2: event["address_2"],
        city: event["city"],
        state: event["state"],
        postal_code: event["postal_code"],
        country: event["country"],
        classification: event["classification"],
        voluntary_mandated: event["voluntary_mandated"],
        initial_firm_notification: event["initial_firm_notification"],
        distribution_pattern: event["distribution_pattern"],
        product_description: event["product_description"],
        product_quantity: event["product_quantity"],
        reason_for_recall: event["reason_for_recall"],
        product_type: event["product_type"],
        recall_initiation_date: event_date,
        center_classification_date: parse_date(event["center_classification_date"]),
        report_date: parse_date(event["report_date"]),
        code_info: event["code_info"]
      )
    end
  end


  def parse_date(date_str)
    return nil unless date_str.present?
    Date.strptime(date_str, "%Y%m%d") rescue nil
  end
end
