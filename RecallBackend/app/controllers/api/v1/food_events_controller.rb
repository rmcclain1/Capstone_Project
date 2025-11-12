class Api::V1::FoodEventsController < ApplicationController
    skip_before_action :authorize_request, only: [:index, :show]
  def index
    events = FoodEvent.all.order(report_date: :desc).limit(1500)
    render json: events.as_json(only: [
      :id,
      :product_description,
      :recalling_firm,
      :reason_for_recall,
      :product_type,
      :recall_number,
      :report_date
    ])
  end

  def show
    event = FoodEvent.find(params[:id])
    render json: event
  end
end