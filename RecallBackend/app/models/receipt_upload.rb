class ReceiptUpload < ApplicationRecord
  belongs_to :user, optional: true
  has_one_attached :image

  enum :status, { processing: 'processing', done: 'done', failed: 'failed' }, prefix: true

  def as_json(*)
    super(only: %i[id status vendor purchased_at total_cents items])
  end
end