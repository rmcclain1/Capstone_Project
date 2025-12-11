# app/controllers/api/v1/pantries_controller.rb
class Api::V1::PantriesController < ApplicationController
  # Use your JWT-based auth
  before_action :authorize_request, except: [:show]
  before_action :set_pantry, only: [:show, :update, :destroy]
  before_action :authorize_pantry_action!, only: [:update, :destroy]

  # GET /api/v1/pantries
  def index
    pantries = build_pantry_query

    # Apply your existing filters
    pantries = pantries.q(params[:q]) if params[:q].present?
    pantries = pantries.category_is(params[:category])
    pantries = pantries.expired_is(params[:expired])
    pantries = pantries.allergen_is(params[:allergen])
    pantries = pantries.country_is(params[:country_of_origin])
    pantries = pantries.manufacturer_is(params[:manufacturer])
    pantries = pantries.lot_between(params[:lot_from], params[:lot_to])
    pantries = pantries.bestby_between(params[:bestby_from], params[:bestby_to])
    pantries = pantries.exp_between(params[:exp_from], params[:exp_to])

    # Apply sorting
    pantries = pantries.sorted(params[:sort])

    # Paginate if requested
    if params[:page].present?
      page = params[:page].to_i
      per_page = params[:per_page]&.to_i || 20
      pantries = pantries.limit(per_page).offset((page - 1) * per_page)
    end

    render json: pantries.map { |p| pantry_json(p) }
  end

  # GET /api/v1/pantries/:id
  def show
    render json: pantry_json(@pantry)
  end

  # POST /api/v1/pantries
  def create
    pantry = Pantry.new(pantry_params)

    # Determine ownership (organization vs personal)
    if pantry_params[:organization_id].present?
      organization = current_user.organizations.find(pantry_params[:organization_id])

      unless current_user.can_in_organization?(organization, :can_add_items)
        return render json: { error: 'Not authorized to add items to this organization' },
                      status: :forbidden
      end

      pantry.organization = organization
      pantry.added_by_user = current_user
    else
      # Personal pantry item
      pantry.user = current_user
    end

    if pantry.save
      render json: pantry_json(pantry), status: :created
    else
      Rails.logger.warn("Pantry create failed: #{pantry.errors.full_messages.join(', ')}")
      render json: { errors: pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/pantries/bulk_create
  def bulk_create
    items = params[:items] || []
    organization_id = params[:organization_id]

    # Validate organization access if specified
    if organization_id.present?
      organization = current_user.organizations.find(organization_id)

      unless current_user.can_in_organization?(organization, :can_add_items)
        return render json: { error: 'Not authorized to add items' }, status: :forbidden
      end
    end

    created_items = []
    errors = []

    items.each_with_index do |item_params, index|
      pantry = Pantry.new(item_params.permit(permitted_attributes))

      if organization_id.present?
        pantry.organization_id = organization_id
        pantry.added_by_user = current_user
      else
        pantry.user = current_user
      end

      if pantry.save
        created_items << pantry
      else
        errors << {
          index: index,
          item_name: item_params[:item_name],
          errors: pantry.errors.full_messages
        }
      end
    end

    render json: {
      success: true,
      created: created_items.count,
      total: items.count,
      items: created_items.map { |p| pantry_json(p) },
      errors: errors
    }, status: :created
  end

  # PATCH /api/v1/pantries/:id
  def update
    if @pantry.update(pantry_params)
      render json: pantry_json(@pantry)
    else
      render json: { errors: @pantry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/pantries/:id
  def destroy
    @pantry.destroy
    render json: { message: 'Pantry item deleted' }
  end

  # GET /api/v1/pantries/expiring_soon
  def expiring_soon
    days = params[:days]&.to_i || 3
    organization_id = params[:organization_id]

    pantries = if organization_id.present?
                 organization = current_user.organizations.find(organization_id)
                 organization.pantries.expiring_soon(days)
               else
                 current_user.pantries.where(organization_id: nil).expiring_soon(days)
               end

    render json: pantries.map { |p| pantry_json(p) }
  end

  # GET /api/v1/pantries/expired
  def expired
    organization_id = params[:organization_id]

    pantries = if organization_id.present?
                 organization = current_user.organizations.find(organization_id)
                 organization.pantries.expired
               else
                 current_user.pantries.where(organization_id: nil).expired
               end

    render json: pantries.map { |p| pantry_json(p) }
  end

  # GET /api/v1/pantries/stats
  def stats
    organization_id = params[:organization_id]

    pantries = if organization_id.present?
                 organization = current_user.organizations.find(organization_id)
                 organization.pantries
               else
                 current_user.pantries.where(organization_id: nil)
               end

    render json: {
      total_items: pantries.sum(:quantity) || 0,
      unique_items: pantries.count,
      expiring_soon: pantries.expiring_soon(3).count,
      expired: pantries.expired.count,
      categories: pantries.group(:category).count,
      locations: pantries.group(:location).count
    }
  end

  private

  def build_pantry_query
  # At this point authorize_request should have run,
  # so current_user should be present.
  raise ActiveRecord::RecordNotFound, "User not authorized" unless current_user

  # Organization pantry
  if params[:organization_id].present?
    organization = current_user.organizations.find(params[:organization_id])
    return organization.pantries.includes(:added_by_user)
  end

  # Personal pantry (specific user) – only allow current_user's own ID
  if params[:user_id].present?
    user_id = params[:user_id].to_i

    # If they ask for their own pantry, return that;
    # if they ask for someone else, give nothing (or you could raise 403).
    return current_user.pantries.where(organization_id: nil) if user_id == current_user.id

    return Pantry.none
  end

  # Default: current user's personal pantry
  current_user.pantries.where(organization_id: nil)
end

  def set_pantry
    @pantry = Pantry.find(params[:id])
  end

  def authorize_pantry_action!
    # Personal pantry item
    if @pantry.personal_item?
      unless @pantry.user_id == current_user&.id
        render json: { error: 'Not authorized' }, status: :forbidden
      end
      return
    end

    # Organization pantry item
    if @pantry.organization_item?
      action = action_name == 'destroy' ? :can_delete_items : :can_edit_items

      unless current_user.can_in_organization?(@pantry.organization, action)
        render json: { error: 'Not authorized' }, status: :forbidden
      end
    end
  end

  def permitted_attributes
    [
      :user_id, :item_name, :quantity, :expiration_date, :bestby_date,
      :manufacturer, :lot_number, :country_of_origin, :allergen,
      :expired, :category, :image_url, :organization_id, :location,
      :batch_number, :notes, :barcode
    ]
  end

  def pantry_params
    # Only allow columns that exist
    existing = permitted_attributes & Pantry.column_names.map(&:to_sym)
    params.require(:pantry).permit(*existing)
  end

  def pantry_json(p)
    base_json = p.as_json(only: [
      :id, :user_id, :organization_id, :item_name, :quantity,
      :expiration_date, :bestby_date, :manufacturer, :lot_number,
      :country_of_origin, :allergen, :expired, :category, :image_url,
      :location, :batch_number, :notes, :barcode, :created_at, :updated_at
    ])

    # Add computed fields from model
    base_json.merge!(
      'owner_name' => p.owner_name,
      'owner_initials' => p.owner_initials,
      'expiring_soon' => p.expiring_soon?,
      'expired' => p.expired?,
      'days_until_expiration' => p.days_until_expiration,
      'is_organization_item' => p.organization_item?
    )

    # Add user info if organization item
    if p.added_by_user.present?
      base_json['added_by'] = {
        'id' => p.added_by_user.id,
        'name' => p.added_by_user.display_name,
        'email' => p.added_by_user.email
      }
    end

    base_json
  end
end
