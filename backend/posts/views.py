from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, LikeSerializer
from users.models import Follow, User
from utils.supabase_storage import get_supabase_storage
from decouple import config
import logging
import os

logger = logging.getLogger(__name__)

def paginate_queryset(queryset, page, page_size=20):
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    
    items = queryset[start_index:end_index]
    
    total_items = queryset.count()
    total_pages = (total_items + page_size - 1) // page_size
    
    return {
        'items': items,
        'pagination': {
            'current_page': page,
            'total_pages': total_pages,
            'total_items': total_items,
            'items_per_page': page_size,
            'has_next': page < total_pages,
            'has_previous': page > 1,
            'next_page': page + 1 if page < total_pages else None,
            'previous_page': page - 1 if page > 1 else None,
        }
    }

class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            from .serializers import PostCreateSerializer
            return PostCreateSerializer
        return PostSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        author_id = self.request.query_params.get('author')
        if author_id:
            if str(author_id) == str(user.id):
                return Post.objects.filter(author_id=author_id, is_active=True).order_by('-created_at')
            elif user.is_staff:
                return Post.objects.filter(author_id=author_id, is_active=True).order_by('-created_at')
            else:
                try:
                    target_user = User.objects.get(id=author_id)
                    if hasattr(target_user, 'profile') and target_user.profile:
                        profile = target_user.profile
                        
                        if profile.privacy == 'public':
                            return Post.objects.filter(author_id=author_id, is_active=True).order_by('-created_at')
                        elif profile.privacy == 'followers_only':
                            try:
                                is_following = Follow.objects.filter(
                                    follower=user, 
                                    following=target_user, 
                                    is_active=True
                                ).exists()
                                if is_following:
                                    return Post.objects.filter(author_id=author_id, is_active=True).order_by('-created_at')
                                else:
                                    return Post.objects.none()
                            except Exception as e:
                                return Post.objects.none()
                        elif profile.privacy == 'private':
                            return Post.objects.none()
                    else:
                        return Post.objects.filter(author_id=author_id, is_active=True).order_by('-created_at')
                except Exception as e:
                    return Post.objects.none()
        
        try:
            if user.is_staff:
                return Post.objects.filter(is_active=True).order_by('-created_at')
            else:
                try:
                    following_users = Follow.objects.filter(follower=user, is_active=True).values_list('following_id', flat=True)
                    return Post.objects.filter(
                        Q(author__in=following_users) | Q(author=user)
                    ).filter(is_active=True).order_by('-created_at')
                except Exception as e:
                    return Post.objects.filter(author=user, is_active=True).order_by('-created_at')
        except Exception as e:
            return Post.objects.filter(author=user, is_active=True).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = int(request.query_params.get('page', 1))
        
        paginated_data = paginate_queryset(queryset, page, page_size=20)
        
        serializer = self.get_serializer(paginated_data['items'], many=True)
        
        response_data = {
            'posts': serializer.data,
            'pagination': paginated_data['pagination']
        }
        
        return Response(response_data)
    
    def perform_create(self, serializer):
        try:
            post = serializer.save(author=self.request.user)
            
            image_file = self.request.FILES.get('image')
            if image_file:
                try:
                    if not config('SUPABASE_URL') or not config('SUPABASE_SERVICE_KEY'):
                        print("WARNING: Supabase credentials not configured. Image upload skipped.")
                        return
                    
                    supabase_storage = get_supabase_storage()
                    file_path, public_url = supabase_storage.upload_image(image_file)
                    
                    post.image_url = public_url
                    post.save(update_fields=['image_url'])
                                        
                except Exception as e:
                    print(f"Image upload failed: {str(e)}")
                    print("Post created successfully but image upload failed")
            else:
                print("No image file provided in request")
                
        except Exception as e:
            print(f"Error in perform_create: {str(e)}")
            logger.error(f"Error in perform_create: {str(e)}")
            raise

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    
    def get_serializer_class(self):
        print(f"PostDetailView.get_serializer_class called for method: {self.request.method}")
        if self.request.method in ['PUT', 'PATCH']:
            from .serializers import PostUpdateSerializer
            return PostUpdateSerializer
        return PostSerializer
    
    def get_queryset(self):
        try:
            user = self.request.user
            if user.is_staff:
                return Post.objects.all()
            else:
                try:
                    following_users = Follow.objects.filter(follower=user, is_active=True).values_list('following_id', flat=True)
                    return Post.objects.filter(
                        Q(author__in=following_users) | Q(author=user)
                    ).filter(is_active=True)
                except Exception as e:
                    return Post.objects.filter(author=user, is_active=True)
        except Exception as e:
            print(f"Error in PostDetailView.get_queryset: {e}")
            return Post.objects.filter(author=user, is_active=True)
    
    def perform_update(self, serializer):
        try:
            post = serializer.save()
            
            image_file = self.request.FILES.get('image')
            if image_file:
                try:
                    if not config('SUPABASE_URL') or not config('SUPABASE_SERVICE_KEY'):
                        print("WARNING: Supabase credentials not configured. Image update skipped.")
                        return
                    
                    supabase_storage = get_supabase_storage()
                    
                    if post.image_url:
                        try:
                            url_parts = post.image_url.split('/')
                            if len(url_parts) >= 2:
                                file_path = f"{url_parts[-2]}/{url_parts[-1]}"
                                supabase_storage.delete_image(file_path)
                        except Exception as e:
                            print(f"Warning: Could not delete old image: {str(e)}")
                    
                    file_path, public_url = supabase_storage.upload_image(image_file)
                    post.image_url = public_url
                    post.save(update_fields=['image_url'])
                    
                except Exception as e:
                    print(f"Image update failed: {str(e)}")
                    print("Post updated successfully but image update failed")

            else:
                print("No new image provided for post")
                
        except Exception as e:
            print(f"Error in perform_update: {str(e)}")
            raise
    
    def perform_destroy(self, instance):
        try:
            if instance.image_url:
                try:
                    supabase_storage = get_supabase_storage()
                    file_path = instance.image_url.split('/')[-2] + '/' + instance.image_url.split('/')[-1]
                    supabase_storage.delete_image(file_path)
                except Exception as e:
                    print(f"Warning: Could not delete image: {str(e)}")
        except Exception as e:
            print(f"Error in perform_destroy: {str(e)}")
        
        try:
            instance.delete()
        except Exception as e:
            print(f"Error deleting post instance: {str(e)}")
            raise

class PersonalizedFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        try:
            user = self.request.user
            
            try:
                following_users = Follow.objects.filter(follower=user, is_active=True).values_list('following_id', flat=True)
                
                queryset = Post.objects.filter(
                    Q(author__in=following_users) | Q(author=user)
                ).filter(is_active=True).order_by('-created_at')
                
                return queryset
            except Exception as e:
                return Post.objects.filter(author=user, is_active=True).order_by('-created_at')
                
        except Exception as e:
            return Post.objects.filter(author=user, is_active=True).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = int(request.query_params.get('page', 1))
        
        paginated_data = paginate_queryset(queryset, page, page_size=20)
        
        serializer = self.get_serializer(paginated_data['items'], many=True)
        
        response_data = {
            'posts': serializer.data,
            'pagination': paginated_data['pagination']
        }
        
        return Response(response_data)

class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        
        existing_like = Like.objects.filter(user=request.user, post=post).first()
        
        if existing_like:
            if existing_like.is_active:
                return Response(
                    {'error': 'You have already liked this post'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                existing_like.is_active = True
                existing_like.save()
        else:
            Like.objects.create(user=request.user, post=post)
        
        post.update_counts()
        return Response({'message': 'Post liked successfully'})
    
    def delete(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        
        try:
            like = Like.objects.get(user=request.user, post=post)
            like.is_active = False
            like.save()
            post.update_counts()
            return Response({'message': 'Post unliked successfully'})
        except Like.DoesNotExist:
            return Response(
                {'error': 'You have not liked this post'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class LikeStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        is_liked = Like.objects.filter(user=request.user, post=post, is_active=True).exists()
        
        return Response({
            'post_id': post_id,
            'is_liked': is_liked,
            'like_count': post.like_count
        })

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        return Comment.objects.filter(post=post, is_active=True).order_by('-created_at')
    
    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        comment = serializer.save(author=self.request.user, post=post)
        post.update_counts()

class CommentDeleteView(generics.DestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Comment.objects.filter(author=self.request.user, is_active=True)
    
    def perform_destroy(self, instance):
        post = instance.post
        instance.delete()
        post.update_counts()

class AdminPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None
    
    def get_queryset(self):
        return Post.objects.all().order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = int(request.query_params.get('page', 1))
        
        paginated_data = paginate_queryset(queryset, page, page_size=20)
        
        serializer = self.get_serializer(paginated_data['items'], many=True)
        
        response_data = {
            'posts': serializer.data,
            'pagination': paginated_data['pagination']
        }
        
        return Response(response_data)

class AdminPostDeleteView(generics.DestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Post.objects.all()
    
    def perform_destroy(self, instance):
        try:
            if instance.image_url:
                supabase_storage = get_supabase_storage()
                file_path = instance.image_url.split('/')[-2] + '/' + instance.image_url.split('/')[-1]
                supabase_storage.delete_image(file_path)
        except Exception as e:
            print(f"Image deletion failed: {str(e)}")
        
        if instance.image_url:
            try:
                url_parts = instance.image_url.split('/')
                if len(url_parts) >= 2:
                    file_path = f"{url_parts[-2]}/{url_parts[-1]}"
                    supabase_storage.delete_image(file_path)
            except Exception as e:
                print(f"Warning: Could not delete image from Supabase: {str(e)}")
        
        instance.delete()
