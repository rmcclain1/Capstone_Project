class User < ApplicationRecord
    has_secure_password
    has_many :pantries
    has_many :notifications, dependent: :destroy
    has_one_attached :avatar
end
