# app/controllers/api/v1/organizations_controller.rb
module Api
  module V1
    class OrganizationsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization, only: [:show, :update, :destroy, :leave]
      before_action :authorize_owner!, only: [:update, :destroy]
      
      # GET /api/v1/organizations
      def index
        organizations = current_user.organizations.active
        render json: organizations.as_json(methods: [:total_items, :expiring_soon_count])
      end
      
      # GET /api/v1/organizations/:id
      def show
        render json: @organization.as_json(
          include: {
            organization_memberships: {
              include: :user,
              only: [:id, :role, :status, :title, :created_at]
            }
          },
          methods: [:total_items, :expiring_soon_count]
        )
      end
      
      # POST /api/v1/organizations
      def create
        organization = Organization.new(organization_params)
        
        if organization.save
          # Create owner membership
          organization.organization_memberships.create!(
            user: current_user,
            role: 'owner',
            status: 'active',
            permissions: OrganizationMembership.default_permissions_for('owner')
          )
          
          render json: organization, status: :created
        else
          render json: { errors: organization.errors.full_messages }, 
                 status: :unprocessable_entity
        end
      end
      
      # PATCH /api/v1/organizations/:id
      def update
        if @organization.update(organization_params)
          render json: @organization
        else
          render json: { errors: @organization.errors.full_messages }, 
                 status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/organizations/:id
      def destroy
        @organization.destroy
        render json: { message: 'Organization deleted successfully' }
      end
      
      # POST /api/v1/organizations/:id/leave
      def leave
        membership = current_user.membership_in(@organization)
        
        if membership.owner? && @organization.owners.count == 1
          return render json: { 
            error: 'Cannot leave - you are the only owner. Transfer ownership first.' 
          }, status: :unprocessable_entity
        end
        
        membership.destroy
        render json: { message: 'Left organization successfully' }
      end
      
      private
      
      def set_organization
        @organization = current_user.organizations.find(params[:id])
      end
      
      def authorize_owner!
        membership = current_user.membership_in(@organization)
        unless membership&.owner?
          render json: { error: 'Only owners can perform this action' }, 
                 status: :forbidden
        end
      end
      
      def organization_params
        params.require(:organization).permit(
          :name, :organization_type, :description, :address, 
          :phone, :email, :member_limit, settings: {}
        )
      end
    end
  end
end