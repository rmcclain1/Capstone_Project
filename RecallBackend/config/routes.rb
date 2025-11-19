Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Password management routes
      post '/users/verify_password', to: 'users#verify_password' # for checking if old password is correct
      patch '/users/update_password', to: 'users#update_password' # for actually updating the password

      # User and Pantry resources
      resources :users, only: [:index, :show, :create, :update, :destroy]
      resources :pantries, only: [:index, :show, :create, :update, :destroy]
      resources :food_events, only: [:index, :show] do
          member do
              get :ai_summary
          end
      end
  resources :notifications, only: [:index] do
          collection do
            post :mark_all_as_read
            get :unread_count
          end
          member do
            patch :mark_as_read
          end
        end
      # Login and Logout routes
      post '/login', to: 'sessions#create'
      delete '/logout', to: 'sessions#destroy' # Optional
    end
  end
end
