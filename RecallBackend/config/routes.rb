Rails.application.routes.draw do
  namespace :api do
    namespace :v1, defaults: { format: :json } do
      # Password management routes
      post  '/users/verify_password',  to: 'users#verify_password'
      patch '/users/update_password',  to: 'users#update_password'

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

      # Firebase ID token -> Rails JWT exchange + session endpoints
      post   '/sessions', to: 'sessions#create'
      delete '/sessions', to: 'sessions#destroy'
      get    '/me',       to: 'sessions#me'

      # Optional backward-compatible aliases
      post   '/login',  to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy'
    end
  end
end
