# app/controllers/api/v1/organization_members_controller.rb
module Api
  module V1
    class OrganizationMembersController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization
      before_action :authorize_member_management!, only: [:update, :destroy]
      
      # GET /api/v1/organizations/:organization_id/members
      def index
        members = @organization.members_with_roles
        render json: members.as_json(include: :user)
      end
      
      # PATCH /api/v1/organizations/:organization_id/members/:id
      def update
        membership = @organization.organization_memberships.find(params[:id])
        
        if membership.update(member_params)
          render json: membership
        else
          render json: { errors: membership.errors.full_messages }, 
                 status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/organizations/:organization_id/members/:id
      def destroy
        membership = @organization.organization_memberships.find(params[:id])
        
        if membership.owner? && @organization.owners.count == 1
          return render json: { 
            error: 'Cannot remove the only owner' 
          }, status: :unprocessable_entity
        end
        
        membership.destroy
        @organization.log_activity(
          user: current_user,
          action: 'removed_member',
          metadata: { removed_user_email: membership.user.email }
        )
        
        render json: { message: 'Member removed successfully' }
      end
      
      private
      
      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      end
      
      def authorize_member_management!
        unless current_user.can_in_organization?(@organization, :can_invite_members)
          render json: { error: 'Not authorized' }, status: :forbidden
        end
      end
      
      def member_params
        params.require(:member).permit(:role, :title, :status, permissions: {})
      end
    end
  end
end