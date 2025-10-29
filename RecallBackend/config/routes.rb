Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # User and Pantry resources
      resources :users, only: [:index, :show, :create, :update, :destroy]
      resources :pantries, only: [:index, :show, :create, :update, :destroy]

      resources :food_events, only: [:index, :show]

      # Login and Logout routes
      post '/login', to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy' # Optional
    end
  end
end
