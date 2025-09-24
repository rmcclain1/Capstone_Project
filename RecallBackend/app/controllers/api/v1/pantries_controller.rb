class Api::V1::PantriesController < ApplicationController
  def index
    pantries = Pantry.all
    render json: pantries
  end

  def show
    pantry = Pantry.find(params[:id])
    render json: pantry
  end

  def create
    pantry = Pantry.new(pantry_params)
    if pantry.save
      render json: pantry, status: :created
    else
      render json: { errors: pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def pantry_params
    params.require(:pantry).permit(:user_id, :item_name, :quantity)
  end
end

