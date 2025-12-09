# app/controllers/api/v1/organization_activities_controller.rb
module Api
  module V1
    class OrganizationActivitiesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization
      
      def index
        activities = @organization.organization_activities
          .includes(:user)
          .recent(50)
        
        render json: activities.as_json(include: { user: { only: [:id, :email, :username] } })
      end
      
      private
      
      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      end
    end
  end
end