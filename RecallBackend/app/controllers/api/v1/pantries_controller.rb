# app/controllers/api/v1/pantries_controller.rb

class Api::V1::PantriesController < ApplicationController
  before_action :set_pantry, only: [:show, :update, :destroy]

  # GET /api/v1/pantries or /api/v1/pantries?user_id=1
  def index
    if params[:user_id]
      pantries = Pantry.where(user_id: params[:user_id])
    else
      pantries = Pantry.all
    end

    render json: pantries
  end

  # GET /api/v1/pantries/:id
  def show
    render json: @pantry
  end

  # POST /api/v1/pantries
  def create
    pantry = Pantry.new(pantry_params)

    if pantry.save
      render json: pantry, status: :created
    else
      render json: { errors: pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT /api/v1/pantries/:id
  def update
    if @pantry.update(pantry_params)
      render json: @pantry
    else
      render json: { errors: @pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/pantries/:id
  def destroy
    @pantry.destroy
    render json: { message: 'Pantry item deleted' }
  end

  private

  def set_pantry
    @pantry = Pantry.find(params[:id])
  end

  def pantry_params
    params.require(:pantry).permit(:user_id, :item_name, :quantity)
  end
end
