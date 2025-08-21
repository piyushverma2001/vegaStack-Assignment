from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as JWTTokenRefreshView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from .models import Profile, Follow, EmailVerificationToken, PasswordResetToken
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    ProfileSerializer, UserUpdateSerializer, FollowSerializer,
    PasswordChangeSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer,
    EmailVerificationSerializer
)

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            user.is_verified = True
            user.save()
            
            return Response({
                'message': 'Registration successful! Your account is now active and you can login immediately.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                verification_token = EmailVerificationToken.objects.get(
                    token=token,
                    is_used=False
                )
                
                if verification_token.is_expired():
                    return Response({
                        'error': 'Verification token has expired. Please request a new one.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                verification_token.is_used = True
                verification_token.save()
                
                user = verification_token.user
                user.is_verified = True
                user.save()
                
                return Response({
                    'message': 'Email verified successfully! You can now login to your account.'
                })
                
            except EmailVerificationToken.DoesNotExist:
                return Response({
                    'error': 'Invalid or expired verification token.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            if user.is_verified:
                return Response({
                    'message': 'User is already verified.'
                })
            
            verification_token = EmailVerificationToken.create_for_user(user)
            
            return Response({
                'message': 'Verification email sent! Please check your inbox.',
                'verification_token': verification_token.token,
            })
            
        except User.DoesNotExist:
            return Response({
                'message': 'If an account with this email exists, a verification email has been sent.'
            })

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            user.save()
            
            return Response({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                from .models import InvalidatedRefreshToken
                InvalidatedRefreshToken.invalidate_token(refresh_token, request.user)
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'message': 'Successfully logged out'})

class TokenRefreshView(JWTTokenRefreshView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            from .models import InvalidatedRefreshToken
            if InvalidatedRefreshToken.is_invalidated(refresh_token):
                return Response({
                    'error': 'Token has been invalidated'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return super().post(request, *args, **kwargs)

class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):        
        try:
            from django.db import connection
            cursor = connection.cursor()
            
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%'")
            user_tables = cursor.fetchall()
            
            table_name = User._meta.db_table
            
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                user_count_db = cursor.fetchone()[0]
            except Exception as e:
                user_count_db = 0
            
            user_count = User.objects.count()
            
            if user_count > 0:
                sample_user = User.objects.first()
            
            else:
                print("No users found in database via ORM")
        except Exception as e:
            return Response({
                'error': 'Database connection error. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            username_or_email = serializer.validated_data['username']
            
            try:
                try:
                    user_by_username = User.objects.get(username=username_or_email)
                    user = user_by_username
                except User.DoesNotExist:
                    user_by_username = None
                
                if not user_by_username:
                    try:
                        user_by_email = User.objects.get(email=username_or_email)
                        user = user_by_email
                    except User.DoesNotExist:
                        user_by_email = None
                
                if not user_by_username and not user_by_email:
                    raise User.DoesNotExist
                
                reset_token = PasswordResetToken.create_for_user(user)
                if not reset_token:
                    return Response({
                        'error': 'Failed to generate password reset token. Please try again.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    'message': 'Password reset token generated successfully!',
                    'reset_token': reset_token.token,
                    'expires_at': reset_token.expires_at.isoformat(),
                    'username': user.username
                })
                
            except User.DoesNotExist:
                all_users = User.objects.all()
                similar_usernames = [u.username for u in all_users if username_or_email.lower() in u.username.lower()]
                similar_emails = [u.email for u in all_users if username_or_email.lower() in u.email.lower()]
                return Response({
                    'error': 'User with this username or email does not exist.'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({
                    'error': 'An unexpected error occurred. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                reset_token = PasswordResetToken.objects.get(
                    token=token,
                    is_used=False
                )
                
                if reset_token.is_expired():
                    return Response({
                        'error': 'Password reset token has expired. Please request a new one.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                reset_token.is_used = True
                reset_token.save()
                
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                
                return Response({
                    'message': 'Password has been reset successfully. You can now login with your new password.'
                })
                
            except PasswordResetToken.DoesNotExist:
                return Response({
                    'error': 'Invalid or expired password reset token.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = 'id'


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    queryset = User.objects.all().order_by('-created_at')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
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

class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.id == user_id:
            return Response(
                {'error': 'You cannot follow yourself'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_to_follow = get_object_or_404(User, id=user_id)
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user, 
            following=user_to_follow,
            defaults={'is_active': True}
        )
        
        if not created:
            if not follow.is_active:
                follow.is_active = True
                follow.save()
                return Response({'message': 'Successfully followed user'})
            else:
                return Response(
                    {'error': 'You are already following this user'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response({'message': 'Successfully followed user'})

class FollowStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            is_following = Follow.objects.filter(
                follower=request.user, 
                following_id=user_id, 
                is_active=True
            ).exists()
            return Response({'is_following': is_following})
        except Exception:
            return Response({'is_following': False})

class UnfollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        return self._unfollow_user(request, user_id)
    
    def delete(self, request, user_id):
        return self._unfollow_user(request, user_id)
    
    def _unfollow_user(self, request, user_id):
        user_to_unfollow = get_object_or_404(User, id=user_id)
        
        try:
            follow = Follow.objects.get(follower=request.user, following=user_to_unfollow)
            follow.is_active = False
            follow.save()
            return Response({'message': 'Successfully unfollowed user'})
        except Follow.DoesNotExist:
            return Response(
                {'error': 'You are not following this user'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class UserFollowersView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return Follow.objects.filter(following=user).select_related('follower')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = int(request.query_params.get('page', 1))
        page_size = 20
        
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        followers = queryset[start_index:end_index]
        
        serializer = self.get_serializer(followers, many=True)
        
        total_followers = queryset.count()
        total_pages = (total_followers + page_size - 1) // page_size
        
        response_data = {
            'followers': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_followers': total_followers,
                'followers_per_page': page_size,
                'has_next': page < total_pages,
                'has_previous': page > 1,
                'next_page': page + 1 if page < total_pages else None,
                'previous_page': page - 1 if page > 1 else None,
            }
        }
        
        return Response(response_data)

class UserFollowingView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return Follow.objects.filter(follower=user).select_related('following')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        page = int(request.query_params.get('page', 1))
        page_size = 20
        
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        following = queryset[start_index:end_index]
        
        serializer = self.get_serializer(following, many=True)
        
        total_following = queryset.count()
        total_pages = (total_following + page_size - 1) // page_size
        
        response_data = {
            'following': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_following': total_following,
                'following_per_page': page_size,
                'has_next': page < total_pages,
                'has_previous': page > 1,
                'next_page': page + 1 if page < total_pages else None,
                'previous_page': page - 1 if page > 1 else None,
            }
        }
        
        return Response(response_data)

class DiscoverUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = User.objects.exclude(id=user.id).filter(is_active=True)
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
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

class UserSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get(self, request):
        user = request.user
        profile = user.profile
        
        settings_data = {
            'user': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'username': user.username,
            },
            'profile': {
                'bio': profile.bio,
                'avatar_url': profile.avatar_url,
                'website': profile.website,
                'location': profile.location,
                'privacy': profile.privacy,
            },
            'preferences': {
                'email_notifications': True,
                'push_notifications': True,
            }
        }
        
        return Response(settings_data)
    
    def put(self, request):
        user = request.user
        profile = user.profile
        
        user_fields = ['first_name', 'last_name']
        for field in user_fields:
            if field in request.data.get('user', {}):
                setattr(user, field, request.data['user'][field])
        
        profile_fields = ['bio', 'website', 'location', 'privacy']
        for field in profile_fields:
            if field in request.data.get('profile', {}):
                setattr(profile, field, request.data['profile'][field])
        
        user.save()
        profile.save()
        
        return Response({
            'message': 'Settings updated successfully',
            'user': UserSerializer(user).data
        })

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        avatar_file = request.FILES.get('avatar')
        
        if not avatar_file:
            return Response({
                'error': 'No avatar file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from decouple import config
            if not config('SUPABASE_URL') or not config('SUPABASE_SERVICE_KEY'):
                return Response({
                    'error': 'Image upload service not configured'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            from utils.supabase_storage import get_supabase_storage
            supabase_storage = get_supabase_storage()
            
            file_path, public_url = supabase_storage.upload_image(avatar_file, folder='avatars')
            
            user = request.user
            profile = user.profile
            
            if profile.avatar_url:
                try:
                    old_file_path = profile.avatar_url.split('/')[-2] + '/' + profile.avatar_url.split('/')[-1]
                    supabase_storage.delete_image(old_file_path)
                except Exception as e:
                    print(f"Warning: Could not delete old avatar: {str(e)}")
            
            profile.avatar_url = public_url
            profile.save()
            
            return Response({
                'message': 'Avatar uploaded successfully',
                'avatar_url': public_url
            })
            
        except Exception as e:
            return Response({
                'error': f'Avatar upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AvatarRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request):
        try:
            user = request.user
            profile = user.profile
            
            if not profile.avatar_url:
                return Response({
                    'error': 'No avatar to remove'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                from utils.supabase_storage import get_supabase_storage
                supabase_storage = get_supabase_storage()
                
                file_path = profile.avatar_url.split('/')[-2] + '/' + profile.avatar_url.split('/')[-1]
                supabase_storage.delete_image(file_path)
            except Exception as e:
                print(f"Warning: Could not delete avatar from storage: {str(e)}")
            
            profile.avatar_url = ''
            profile.save()
            
            return Response({
                'message': 'Avatar removed successfully'
            })
            
        except Exception as e:
            return Response({
                'error': f'Avatar removal failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
