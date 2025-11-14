class Api::V1::FoodEventsController < ApplicationController
  skip_before_action :authorize_request, only: [:index, :show, :ai_summary]

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

  def ai_summary
      event = FoodEvent.find(params[:id])
      summary = FoodEventSummarizer.call(event)
      render json: summary
    rescue => e
      Rails.logger.error("[FoodEventsController#ai_summary] #{e.class}: #{e.message}")
      render json: {
        status: "unclear",
        bullets: ["Unable to generate AI summary right now."],
        error: "AI backend error"
      }, status: :bad_gateway
  end
end