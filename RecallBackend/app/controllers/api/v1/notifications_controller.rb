# app/controllers/api/v1/notifications_controller.rb
module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :authenticate_user!

      # GET /api/v1/notifications
      def index
        notifications = current_user.notifications
          .includes(:pantry)
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          notifications: notifications.as_json,
          unread_count: current_user.notifications.active.unread.count,
          archived_count: current_user.notifications.archived.count,
          meta: {
            current_page: notifications.current_page,
            total_pages: notifications.total_pages,
            total_count: notifications.total_count
          }
        }
      rescue => e
        Rails.logger.error "Notifications error: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /api/v1/notifications/:id/mark_read
      def mark_read
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!
        render json: notification
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      # POST /api/v1/notifications/mark_all_read
      def mark_all_read
        current_user.notifications.active.unread.update_all(read: true)
        render json: { 
          success: true, 
          unread_count: 0 
        }
      end

      # POST /api/v1/notifications/:id/archive
      def archive
        notification = current_user.notifications.find(params[:id])
        notification.archive!
        render json: notification
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      # POST /api/v1/notifications/:id/unarchive
      def unarchive
        notification = current_user.notifications.find(params[:id])
        notification.unarchive!
        render json: notification
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      # POST /api/v1/notifications/archive_all_read
      def archive_all_read
        count = current_user.notifications.active.where(read: true).update_all(archived: true)
        render json: { 
          success: true, 
          archived_count: count 
        }
      end

      # DELETE /api/v1/notifications/:id
      def destroy
        notification = current_user.notifications.find(params[:id])
        notification.destroy
        render json: { success: true }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      # DELETE /api/v1/notifications/delete_archived
      def delete_archived
        count = current_user.notifications.archived.destroy_all.count
        render json: { 
          success: true, 
          deleted_count: count 
        }
      end

      # POST /api/v1/notifications/register_token
      def register_token
        token = params[:expo_push_token]
        
        if token.present?
          current_user.register_push_token(token)
          render json: { success: true, message: 'Push token registered' }
        else
          render json: { error: 'Token is required' }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/notifications/unregister_token
      def unregister_token
        current_user.unregister_push_token
        render json: { success: true, message: 'Push token unregistered' }
      end

      # POST /api/v1/notifications/test (for development/testing)
      def test
        if Rails.env.production?
          return render json: { error: 'Not available in production' }, status: :forbidden
        end

        notification = current_user.notifications.create!(
          title: "Test Notification",
          body: "This is a test notification sent at #{Time.current}",
          notification_type: Notification::TYPES[:custom]
        )

        render json: notification
      end
    end
  end
end