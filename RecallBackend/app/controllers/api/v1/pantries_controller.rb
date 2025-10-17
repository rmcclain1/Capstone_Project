class Api::V1::PantriesController < ApplicationController
  before_action :set_pantry, only: [:show, :update, :destroy]

  def index
    pantries =
      if params[:user_id].present?
        Pantry.where(user_id: params[:user_id])
      else
        Pantry.all
      end

    render json: pantries.map { |p| pantry_json(p) }
  end

  def show
    render json: pantry_json(@pantry)
  end

  def create
    pantry = Pantry.new(pantry_params)
    pantry.user_id ||= current_user&.id  # force owner

    if pantry.save
      render json: pantry_json(pantry), status: :created
    else
      Rails.logger.warn("Pantry create failed: #{pantry.errors.full_messages.join(', ')}")
      render json: { errors: pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end


  def update
    if @pantry.update(pantry_params)
      render json: pantry_json(@pantry)
    else
      render json: { errors: @pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @pantry.destroy
    render json: { message: 'Pantry item deleted' }
  end

  private

  def set_pantry
    @pantry = Pantry.find(params[:id])
  end

  # Allow only columns that actually exist (now includes image_url)
  def pantry_params
    allowed = %i[
      user_id item_name expiration_date bestby_date manufacturer
      lot_number country_of_origin allergen expired category image_url
    ]
    existing = allowed & Pantry.column_names.map(&:to_sym)
    params.require(:pantry).permit(*existing)
  end

  def pantry_json(p)
    p.as_json(only: [
      :id, :user_id, :item_name, :expiration_date, :bestby_date, :manufacturer,
      :lot_number, :country_of_origin, :allergen, :expired, :category,
      :image_url, :created_at, :updated_at
    ])
  end
end
