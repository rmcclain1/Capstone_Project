# app/controllers/api/v1/barcodes_controller.rb
module Api
  module V1
    class BarcodesController < ApplicationController
      # Consider adding rate limiting in production
      # throttle 'barcodes/lookup', limit: 30, period: 1.minute
      
      def lookup
        upc = params[:upc].to_s.strip
        
        unless upc.present?
          return render json: { error: 'upc is required' }, status: :unprocessable_entity
        end
        
        # Validate UPC format (8, 12, or 13 digits)
        unless upc.match?(/^\d{8}$|^\d{12}$|^\d{13}$/)
          return render json: { 
            error: 'Invalid UPC format. Must be 8, 12, or 13 digits.' 
          }, status: :unprocessable_entity
        end

        product = OpenFoodFactsService.lookup(upc)
        
        if product
          render json: { product: product }
        else
          render json: { 
            error: 'Product not found',
            upc: upc 
          }, status: :not_found
        end
      rescue => e
        Rails.logger.error "Barcode lookup failed: #{e.message}"
        render json: { 
          error: 'Lookup service unavailable',
          details: e.message 
        }, status: :service_unavailable
      end
    end
  end
end