from django.urls import path
from . import admin_views

app_name = 'admin'

urlpatterns = [
    path('', admin_views.AdminUserListView.as_view(), name='user-list'),
    path('<uuid:pk>/', admin_views.AdminUserDetailView.as_view(), name='user-detail'),
    path('<uuid:pk>/deactivate/', admin_views.AdminUserDeactivateView.as_view(), name='user-deactivate'),
    path('<uuid:pk>/activate/', admin_views.AdminUserActivateView.as_view(), name='user-activate'),
    path('<uuid:pk>/delete/', admin_views.AdminUserDeleteView.as_view(), name='user-delete'),
    path('<uuid:pk>/role/', admin_views.AdminUserRoleUpdateView.as_view(), name='user-role-update'),
    
    path('stats/', admin_views.AdminStatsView.as_view(), name='stats'),
]

