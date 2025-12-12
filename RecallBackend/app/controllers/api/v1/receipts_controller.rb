# app/controllers/api/v1/receipts_controller.rb
module Api
  module V1
    class ReceiptsController < ApplicationController
      def create
        unless params[:image].present?
          return render json: { error: 'image is required' }, status: :unprocessable_entity
        end

        # Validate file type
        content_type = params[:image].content_type
        unless content_type.in?(['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'])
          return render json: { 
            error: 'Invalid file type. Only JPEG, PNG, and PDF are supported.' 
          }, status: :unprocessable_entity
        end

        rec = ReceiptUpload.create!(
          user_id: current_user&.id,
          status: 'processing'
        )
        rec.image.attach(params[:image])

        # FIXED: Use proper ActiveStorage API with blob.open
        begin
          rec.image.blob.open do |file|
            items = ReceiptParser.extract_items(file.path, content_type)

            if items.empty?
              rec.update!(status: 'done', items: [])
            else
              rec.update!(items: items, status: 'done')
            end
          end
        rescue => e
          Rails.logger.error "Receipt processing failed: #{e.message}"
          rec.update!(status: 'failed')
          return render json: { 
            error: 'Failed to process receipt',
            message: 'Please try again later'
          }, status: :unprocessable_entity
        end

        render json: rec, status: :created
      end

      def show
        rec = ReceiptUpload.find(params[:id])
        
        # Security: ensure user can only see their own receipts
        if rec.user_id != current_user&.id
          return render json: { error: 'Not found' }, status: :not_found
        end
        
        render json: rec
      end
    end
  end
end
