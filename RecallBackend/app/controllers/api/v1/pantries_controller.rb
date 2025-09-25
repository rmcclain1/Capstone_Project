class Api::V1::PantriesController < ApplicationController
  before_action :set_pantry, only: [:show, :update, :destroy]

  # GET use cases of /api/v1/pantries or /api/v1/pantries?user_id=1 to select a pantry from a specific user
  def index
    if params[:user_id]
      pantries = Pantry.where(user_id: params[:user_id])
    else
      pantries = Pantry.all
    end

    render json: pantries
  end

  def show
    render json: @pantry
  end

  def create
    pantry = Pantry.new(pantry_params)

    if pantry.save
      render json: pantry, status: :created
    else
      render json: { errors: pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @pantry.update(pantry_params)
      render json: @pantry
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

  def pantry_params
    params.require(:pantry).permit(:user_id, :item_name, :quantity)
  end
end
