# app/controllers/api/v1/notifications_controller.rb
class Api::V1::NotificationsController < ApplicationController
  skip_before_action :authorize_request, only: [] # Don't skip, we need auth
  before_action :check_user

  def index
    notifications = current_user.notifications.order(created_at: :desc)
    render json: notifications
  rescue => e
    Rails.logger.error "Notifications error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render json: { error: e.message }, status: :internal_server_error
  end

  def mark_as_read
    notification = current_user.notifications.find(params[:id])
    notification.update(read: true)
    render json: notification
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Notification not found' }, status: :not_found
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  def mark_all_as_read
    current_user.notifications.where(read: false).update_all(read: true)
    render json: { success: true }
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  def unread_count
    count = current_user.notifications.where(read: false).count
    render json: { count: count }
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  private

  def check_user
    render json: { error: 'User not authenticated' }, status: :unauthorized unless current_user
  end
end