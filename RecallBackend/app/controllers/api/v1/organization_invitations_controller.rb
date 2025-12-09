# app/controllers/api/v1/organization_invitations_controller.rb
module Api
  module V1
    class OrganizationInvitationsController < ApplicationController
      before_action :authenticate_user!, except: [:accept_from_link]
      before_action :set_organization, only: [:index, :create]
      before_action :authorize_invite!, only: [:create]
      
      # GET /api/v1/organizations/:organization_id/invitations
      def index
        invitations = @organization.organization_invitations.pending
        render json: invitations
      end
      
      # POST /api/v1/organizations/:organization_id/invitations
      def create
        if @organization.at_member_limit?
          return render json: { error: 'Organization has reached member limit' }, 
                       status: :unprocessable_entity
        end
        
        invitation = @organization.organization_invitations.new(invitation_params)
        invitation.invited_by = current_user
        
        if invitation.save
          # TODO: Send invitation email
          # OrganizationMailer.invitation_email(invitation).deliver_later
          
          @organization.log_activity(
            user: current_user,
            action: 'sent_invitation',
            metadata: { email: invitation.email, role: invitation.role }
          )
          
          render json: invitation, status: :created
        else
          render json: { errors: invitation.errors.full_messages }, 
                 status: :unprocessable_entity
        end
      end
      
      # POST /api/v1/organization_invitations/:token/accept
      def accept
        invitation = OrganizationInvitation.find_by!(token: params[:token])
        
        if invitation.expired?
          return render json: { error: 'Invitation has expired' }, 
                       status: :unprocessable_entity
        end
        
        membership = invitation.accept!(current_user)
        
        if membership
          render json: { 
            message: 'Invitation accepted', 
            organization: invitation.organization 
          }
        else
          render json: { error: 'Failed to accept invitation' }, 
                 status: :unprocessable_entity
        end
      end
      
      # POST /api/v1/organization_invitations/:token/decline
      def decline
        invitation = OrganizationInvitation.find_by!(token: params[:token])
        invitation.decline!
        render json: { message: 'Invitation declined' }
      end
      
      private
      
      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      end
      
      def authorize_invite!
        unless current_user.can_in_organization?(@organization, :can_invite_members)
          render json: { error: 'Not authorized to invite members' }, 
                 status: :forbidden
        end
      end
      
      def invitation_params
        params.require(:invitation).permit(:email, :role)
      end
    end
  end
end