# app/controllers/api/v1/barcodes_controller.rb
module Api
  module V1
    class BarcodesController < ApplicationController
      skip_before_action :authenticate_user!, only: []

      def lookup
        upc = params[:upc].to_s
        unless upc.present?
          return render json: { error: 'upc is required' }, status: :unprocessable_entity
        end

        product = OpenFoodFactsService.lookup(upc)
        if product
          render json: { product: product }
        else
          render json: { product: nil }, status: :not_found
        end
      end
    end
  end
end