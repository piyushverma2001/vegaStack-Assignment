from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .serializers import UserSerializer
from .permissions import IsAdminRole
from posts.models import Post

User = get_user_model()

class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    pagination_class = None
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = int(request.query_params.get('page', 1))
        page_size = 20
        
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        users = queryset[start_index:end_index]
        
        serializer = self.get_serializer(users, many=True)
        
        total_users = queryset.count()
        total_pages = (total_users + page_size - 1) // page_size
        
        response_data = {
            'users': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_users': total_users,
                'users_per_page': page_size,
                'has_next': page < total_pages,
                'has_previous': page > 1,
                'next_page': page + 1 if page < total_pages else None,
                'previous_page': page - 1 if page > 1 else None,
            }
        }
        
        return Response(response_data)

class AdminUserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()

class AdminUserDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()
    
    def post(self, request, pk):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'user deactivated'})

class AdminUserActivateView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()
    
    def post(self, request, pk):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'user activated'})

class AdminUserDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        try:
            user = self.get_object()
            username = user.username
                        
            from posts.models import Post, Comment, Like
            from .models import Follow, EmailVerificationToken, PasswordResetToken
            
            posts_count = Post.objects.filter(author=user).count()
            comments_count = Comment.objects.filter(author=user).count()
            likes_count = Like.objects.filter(user=user).count()
            follows_count = Follow.objects.filter(follower=user).count() + Follow.objects.filter(following=user).count()
            
            user.delete()
            
            return Response({'status': f'user {username} deleted permanently'})
        except Exception as e:
            return Response(
                {'error': f'Failed to delete user: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminUserRoleUpdateView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()
    
    def post(self, request, pk):
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['user', 'admin']:
            return Response(
                {'error': 'Invalid role. Must be "user" or "admin"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        return Response({'status': f'user role updated to {new_role}'})

class AdminStatsView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    
    def get(self, request):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        admin_users = User.objects.filter(role='admin').count()
        regular_users = User.objects.filter(role='user').count()
        
        total_posts = Post.objects.count()
        posts_today = Post.objects.filter(created_at__date=today).count()
        posts_yesterday = Post.objects.filter(created_at__date=yesterday).count()
        
        active_users_today = User.objects.filter(
            last_login__date=today
        ).count()
        
        new_users_this_week = User.objects.filter(
            created_at__date__gte=today - timedelta(days=7)
        ).count()
        
        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'inactive': inactive_users,
                'admins': admin_users,
                'regular': regular_users,
                'new_this_week': new_users_this_week,
                'active_today': active_users_today
            },
            'posts': {
                'total': total_posts,
                'today': posts_today,
                'yesterday': posts_yesterday
            },
            'date': {
                'today': today.isoformat(),
                'yesterday': yesterday.isoformat()
            }
        }
        
        return Response(stats)
