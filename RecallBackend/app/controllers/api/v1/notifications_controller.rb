# app/controllers/api/v1/notifications_controller.rb
class Api::V1::NotificationsController < ApplicationController
  before_action :check_user

  def index
    notifications = current_user.notifications.order(created_at: :desc)
    render json: notifications
  rescue => e
    Rails.logger.error "Notifications error: #{e.message}"
    render json: { error: e.message }, status: :internal_server_error
  end

  def destroy
    notification = current_user.notifications.find(params[:id])
    notification.destroy
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Notification not found' }, status: :not_found
  rescue => e
    render json: { error: e.message }, status: :internal_server_error
  end

  private

  def check_user
    render json: { error: 'User not authenticated' }, status: :unauthorized unless current_user
  end
end