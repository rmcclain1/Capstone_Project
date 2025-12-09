# app/jobs/receipt_processing_job.rb
class ReceiptProcessingJob < ApplicationJob
  queue_as :default
  
  def perform(receipt_id)
    rec = ReceiptUpload.find(receipt_id)
    return if rec.status != 'processing'
    
    path = ActiveStorage::Blob.service.send(:path_for, rec.image.blob.key)
    items = ReceiptParser.extract_items(path)
    
    rec.update!(items: items, status: 'done')
  rescue => e
    Rails.logger.error "Receipt #{receipt_id} processing failed: #{e.message}"
    rec.update!(status: 'failed')
    raise e  # Re-raise for retry logic
  end
end