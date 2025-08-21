from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    path('', views.PostListCreateView.as_view(), name='post-list-create'),
    path('<uuid:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    
    path('feed/', views.PersonalizedFeedView.as_view(), name='feed'),
    
    path('<uuid:post_id>/like/', views.LikePostView.as_view(), name='post-like'),
    path('<uuid:post_id>/like-status/', views.LikeStatusView.as_view(), name='post-like-status'),
    
    path('<uuid:post_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list-create'),
    path('comments/<uuid:pk>/', views.CommentDeleteView.as_view(), name='comment-delete'),
]

admin_urlpatterns = [
    path('posts/', views.AdminPostListView.as_view(), name='admin-post-list'),
    path('posts/<uuid:post_id>/delete/', views.AdminPostDeleteView.as_view(), name='admin-post-delete'),
]
