from django.urls import path
from . import admin_views

app_name = 'admin'

urlpatterns = [
    path('', admin_views.AdminPostListView.as_view(), name='post-list'),
    path('<uuid:pk>/', admin_views.AdminPostDetailView.as_view(), name='post-detail'),
    path('<uuid:pk>/delete/', admin_views.AdminPostDeleteView.as_view(), name='post-delete'),
    path('bulk-delete/', admin_views.AdminPostBulkDeleteView.as_view(), name='post-bulk-delete'),
    
    path('comments/', admin_views.AdminCommentListView.as_view(), name='comment-list'),
    path('comments/<uuid:pk>/delete/', admin_views.AdminCommentDeleteView.as_view(), name='comment-delete'),
    
    path('content-stats/', admin_views.AdminContentStatsView.as_view(), name='content-stats'),
]

