Rails.application.routes.draw do
  namespace :api do
    namespace :v1, defaults: { format: :json } do
      resources :users,    only: [:index, :show, :create, :update, :destroy]
      resources :pantries, only: [:index, :show, :create, :update, :destroy]
      resources :food_events, only: [:index, :show]
      resources :ai, only: [] do
        collection do
          post 'chat'
        end
      end
      resources :barcodes, only: [] do
        collection { post :lookup }
      end

      resources :receipts, only: [:create, :show]
      

      # Firebase ID token -> Rails JWT exchange + session endpoints
      post   '/sessions', to: 'sessions#create'
      delete '/sessions', to: 'sessions#destroy'
      get    '/me',       to: 'sessions#me'

      # Optional backward-compatible aliases (safe to keep or remove later)
      post   '/login',  to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy'
    end
  end
end
