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

        # TODO: Move to background job (Sidekiq)
        # ReceiptProcessingJob.perform_later(rec.id)
        
        # For now, process synchronously with error handling
        begin
          path = ActiveStorage::Blob.service.send(:path_for, rec.image.blob.key)
          items = ReceiptParser.extract_items(path)
          
          if items.empty?
            rec.update!(status: 'done', items: [])
          else
            rec.update!(items: items, status: 'done')
          end
        rescue => e
          Rails.logger.error "Receipt processing failed: #{e.message}"
          rec.update!(status: 'failed')
          return render json: { 
            error: 'Failed to process receipt',
            details: e.message 
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