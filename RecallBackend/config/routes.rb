Rails.application.routes.draw do
  namespace :api do
    namespace :v1, defaults: { format: :json } do
      # Password management routes
      post  '/users/verify_password', to: 'users#verify_password'
      patch '/users/update_password', to: 'users#update_password'

      # User and Pantry resources
      resources :users,    only: [:index, :show, :create, :update, :destroy]
      resources :pantries, only: [:index, :show, :create, :update, :destroy]

      # Food events (recalls)
      resources :food_events, only: [:index, :show] do
        member do
          get :ai_summary
        end
      end

      # AI chat (backend proxy)
      resources :ai, only: [] do
        collection do
          post 'chat'
        end
      end

      # Barcode lookup + receipt upload
      resources :barcodes, only: [] do
        collection { post :lookup }
      end

      resources :receipts, only: [:create, :show]

      # Notifications
      resources :notifications, only: [:index, :destroy] do
        collection do
          post   :mark_all_read
          post   :archive_all_read
          delete :delete_archived
          post   :register_token
          post   :unregister_token
          post   :test
        end

        member do
          post :mark_read
          post :archive
          post :unarchive
        end
      end

      # Firebase ID token -> Rails JWT exchange + session endpoints
      post   '/sessions', to: 'sessions#create'
      post   '/sessions/apple', to: 'sessions#apple'
      delete '/sessions', to: 'sessions#destroy'
      get    '/me',       to: 'sessions#me'

      # Optional backward-compatible aliases
      post   '/login',  to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy'

      # Organizations
      resources :organizations do
        member do
          post :leave
        end

        resources :members,
                  controller: 'organization_members',
                  only: [:index, :update, :destroy]

        resources :invitations,
                  controller: 'organization_invitations',
                  only: [:index, :create]

        resources :activities,
                  controller: 'organization_activities',
                  only: [:index]
      end

      # Public invitation acceptance
      post '/organization_invitations/:token/accept',
           to: 'organization_invitations#accept'
      post '/organization_invitations/:token/decline',
           to: 'organization_invitations#decline'

      # Pantry bulk operations
      post '/pantries/bulk_create',    to: 'pantries#bulk_create'
      get  '/pantries/expiring_soon',  to: 'pantries#expiring_soon'
      get  '/pantries/expired',        to: 'pantries#expired'
      get  '/pantries/stats',          to: 'pantries#stats'
    end
  end
end
