# frozen_string_literal: true
require "net/http"
require "json"

module Api
  module V1
    class FoodEventsController < ApplicationController
      # Recalls are public read
      skip_before_action :authorize_request, only: [:index, :show]

      # GET /api/v1/food_events
      def index
        base = FoodEvent.order(report_date: :desc)

        if params[:q].present?
          term = "%#{params[:q].to_s.strip}%"
          base = base.where(<<~SQL.squish, term:, term2: term, term3: term, term4: term)
            product_description ILIKE :term
            OR recalling_firm ILIKE :term2
            OR reason_for_recall ILIKE :term3
            OR code_info ILIKE :term4
          SQL
        end
        base = base.where(status: params[:status]) if params[:status].present?
        base = base.where(classification: params[:classification]) if params[:classification].present?
        base = base.where(state: params[:state]) if params[:state].present?

        if params[:date_from].present?
          from = (Date.parse(params[:date_from]) rescue nil)
          base = base.where('report_date >= ?', from) if from
        end
        if params[:date_to].present?
          to = (Date.parse(params[:date_to]) rescue nil)
          base = base.where('report_date <= ?', to) if to
        end

        page = params[:page].to_i > 0 ? params[:page].to_i : 1
        per  = params[:per].to_i.between?(1, 100) ? params[:per].to_i : 25

        total = base.count
        rows  = base.limit(per).offset((page - 1) * per)

        # If DB has nothing, show live FDA data so the app always has recalls
        if total.zero?
          data, total_remote = fetch_openfda(params[:q], page, per)
          render json: { data:, meta: { page:, per:, count: total_remote } } and return
        end

        render json: {
          data: rows.as_json(only: [
            :id, :event_id, :recall_number, :status, :recalling_firm, :city, :state,
            :classification, :product_description, :reason_for_recall, :product_type,
            :report_date, :recall_initiation_date, :center_classification_date, :code_info
          ]),
          meta: { page:, per:, count: total }
        }
      end

      # GET /api/v1/food_events/:id
      def show
        fe = FoodEvent.find(params[:id])
        render json: fe.as_json
      end

      private

      def fetch_openfda(q, page, per)
        uri = URI("https://api.fda.gov/food/enforcement.json")
        params = { limit: per, skip: (page - 1) * per }
        if q.present?
          s = q.to_s
          fields = %w[product_description recalling_firm reason_for_recall code_info]
          params[:search] = fields.map { |f| "#{f}:#{s}" }.join("+OR+")
        end
        uri.query = URI.encode_www_form(params)

        res = Net::HTTP.get_response(uri)
        return [[], 0] unless res.is_a?(Net::HTTPSuccess)

        json = JSON.parse(res.body) rescue {}
        results = Array(json["results"])
        total   = json.dig("meta", "results", "total") || results.size

        data = results.map do |r|
          {
            id: 0, # not persisted
            event_id: r["event_id"],
            recall_number: r["recall_number"],
            status: r["status"],
            recalling_firm: r["recalling_firm"],
            city: r["city"],
            state: r["state"],
            classification: r["classification"],
            product_description: r["product_description"],
            reason_for_recall: r["reason_for_recall"],
            product_type: r["product_type"],
            report_date: fmt_date(r["report_date"]),
            recall_initiation_date: fmt_date(r["recall_initiation_date"]),
            center_classification_date: fmt_date(r["center_classification_date"]),
            code_info: r["code_info"],
          }
        end

        [data, total]
      rescue
        [[], 0]
      end

      def fmt_date(s)
        return nil unless s.present?
        return Date.strptime(s, "%Y%m%d").to_s rescue nil if s.match?(/^\d{8}$/)
        Date.parse(s).to_s rescue nil
      end
    end
  end
end
