# app/services/open_food_facts_service.rb
require 'net/http'
require 'json'

class OpenFoodFactsService
  BASE = URI('https://world.openfoodfacts.org')

  def self.lookup(upc)
    code = upc.to_s.gsub(/\D/, '')
    return nil if code.empty?
    path = "/api/v2/product/#{code}.json"
    url = BASE + path
    res = Net::HTTP.get_response(url)
    return nil unless res.is_a?(Net::HTTPSuccess)
    body = JSON.parse(res.body) rescue {}
    prod = body['product'] || {}
    return nil if prod.empty?

    {
      upc: code,
      name: prod['product_name'] || prod['generic_name'] || 'Unknown product',
      brand: (prod['brands_tags']&.first || prod['brands']).to_s,
      category: (prod['categories_tags']&.first || prod['categories']).to_s,
      image_url: prod['image_url'],
      size: prod['quantity']
    }
  rescue => e
    Rails.logger.warn("OFF lookup failed: #{e.class}: #{e.message}")
    nil
  end
end