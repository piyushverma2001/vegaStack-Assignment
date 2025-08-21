from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('logout/', views.UserLogoutView.as_view(), name='user-logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),
    
    path('verify-email/', views.EmailVerificationView.as_view(), name='verify-email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    
    path('password-reset/', views.PasswordResetView.as_view(), name='password-reset'),
    path('password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('settings/', views.UserSettingsView.as_view(), name='user-settings'),
    path('avatar-upload/', views.AvatarUploadView.as_view(), name='avatar-upload'),
    path('avatar-remove/', views.AvatarRemoveView.as_view(), name='avatar-remove'),
    path('', views.UserListView.as_view(), name='user-list'),
    path('discover/', views.DiscoverUsersView.as_view(), name='discover-users'),
    path('<uuid:id>/', views.UserDetailView.as_view(), name='user-detail'),
    
    path('<uuid:user_id>/follow/', views.FollowUserView.as_view(), name='follow-user'),
    path('<uuid:user_id>/unfollow/', views.UnfollowUserView.as_view(), name='unfollow-user'),
    path('<uuid:user_id>/follow-status/', views.FollowStatusView.as_view(), name='follow-status'),
    path('<uuid:user_id>/followers/', views.UserFollowersView.as_view(), name='user-followers'),
    path('<uuid:user_id>/following/', views.UserFollowingView.as_view(), name='user-following'),
]
