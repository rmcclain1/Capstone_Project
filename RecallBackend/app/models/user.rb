class User < ApplicationRecord
    has_secure_password
    has_many :pantries
    has_one_attached :avatar
end
