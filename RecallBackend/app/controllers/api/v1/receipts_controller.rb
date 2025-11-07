# app/controllers/api/v1/receipts_controller.rb
module Api
  module V1
    class ReceiptsController < ApplicationController
      def create
        unless params[:image].present?
          return render json: { error: 'image is required' }, status: :unprocessable_entity
        end

        rec = ReceiptUpload.create!(user_id: current_user&.id)
        rec.image.attach(params[:image])

        # MVP: synchronous stub parse (you can background this with Sidekiq later)
        path = ActiveStorage::Blob.service.send(:path_for, rec.image.blob.key)
        items = ReceiptParser.extract_items(path)
        rec.update!(items: items, status: 'done')

        render json: rec
      end

      def show
        rec = ReceiptUpload.find(params[:id])
        render json: rec
      end
    end
  end
end