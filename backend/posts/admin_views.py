from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, AdminCommentSerializer
from users.permissions import IsAdminRole

class AdminPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAdminRole]
    queryset = Post.objects.all().order_by('-created_at')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author__username__icontains=author)
        
        content = self.request.query_params.get('content', None)
        if content:
            queryset = queryset.filter(content__icontains=content)
        
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset

class AdminPostDetailView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAdminRole]
    queryset = Post.objects.all()

class AdminPostDeleteView(generics.DestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAdminRole]
    queryset = Post.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        post_title = post.content[:50] + "..." if len(post.content) > 50 else post.content
        
        if post.image_url:
            try:
                from utils.supabase_storage import get_supabase_storage
                supabase_storage = get_supabase_storage()
                
                url_parts = post.image_url.split('/')
                if len(url_parts) >= 2:
                    file_path = f"{url_parts[-2]}/{url_parts[-1]}"
                    supabase_storage.delete_image(file_path)
            except Exception as e:
                print(f"Warning: Could not delete image from Supabase: {str(e)}")
        
        post.delete()
        return Response({'status': f'post "{post_title}" deleted'})

class AdminPostBulkDeleteView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    
    def post(self, request):
        post_ids = request.data.get('post_ids', [])
        
        if not post_ids:
            return Response(
                {'error': 'No post IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count = 0
        for post_id in post_ids:
            try:
                post = Post.objects.get(id=post_id)
                post.delete()
                deleted_count += 1
            except Post.DoesNotExist:
                continue
        
        return Response({
            'status': f'{deleted_count} posts deleted successfully',
            'deleted_count': deleted_count
        })

class AdminCommentListView(generics.ListAPIView):
    serializer_class = AdminCommentSerializer
    permission_classes = [IsAdminRole]
    queryset = Comment.objects.all().order_by('-created_at')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        post_id = self.request.query_params.get('post', None)
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author__username__icontains=author)
        
        content = self.request.query_params.get('content', None)
        if content:
            queryset = queryset.filter(content__icontains=content)
        
        return queryset

class AdminCommentDeleteView(generics.DestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAdminRole]
    queryset = Comment.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        comment_content = comment.content[:50] + "..." if len(comment.content) > 50 else comment.content
        comment.delete()
        return Response({'status': f'comment "{comment_content}" deleted'})

class AdminContentStatsView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]
    
    def get(self, request):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        total_posts = Post.objects.count()
        posts_today = Post.objects.filter(created_at__date=today).count()
        posts_yesterday = Post.objects.filter(created_at__date=yesterday).count()
        posts_this_week = Post.objects.filter(
            created_at__date__gte=today - timedelta(days=7)
        ).count()
        
        total_comments = Comment.objects.count()
        comments_today = Comment.objects.filter(created_at__date=today).count()
        comments_yesterday = Comment.objects.filter(created_at__date=yesterday).count()
        
        total_likes = Like.objects.count()
        likes_today = Like.objects.filter(created_at__date=today).count()
        
        top_posters = Post.objects.values('author__username').annotate(
            post_count=Count('id')
        ).order_by('-post_count')[:10]
        
        top_commenters = Comment.objects.values('author__username').annotate(
            comment_count=Count('id')
        ).order_by('-comment_count')[:10]
        
        stats = {
            'posts': {
                'total': total_posts,
                'today': posts_today,
                'yesterday': posts_yesterday,
                'this_week': posts_this_week
            },
            'comments': {
                'total': total_comments,
                'today': comments_today,
                'yesterday': comments_yesterday
            },
            'likes': {
                'total': total_likes,
                'today': likes_today
            },
            'top_creators': {
                'posters': list(top_posters),
                'commenters': list(top_commenters)
            }
        }
        
        return Response(stats)
