from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.core.exceptions import ValidationError
import secrets

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=30, unique=True, validators=[
        MinLengthValidator(3, "Username must be at least 3 characters long."),
        MaxLengthValidator(30, "Username cannot exceed 30 characters.")
    ])
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    role = models.CharField(max_length=10, choices=[
        ('user', 'User'),
        ('admin', 'Admin')
    ], default='user')
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    def __str__(self):
        try:
            if hasattr(self, 'first_name') and hasattr(self, 'last_name') and hasattr(self, 'username'):
                return f"{self.first_name} {self.last_name} ({self.username})"
            return f"User {self.id}"
        except Exception as e:
            return f"User {self.id}"
    
    @property
    def full_name(self):
        try:
            if hasattr(self, 'first_name') and hasattr(self, 'last_name'):
                return f"{self.first_name} {self.last_name}"
            return ""
        except Exception as e:
            return ""
    
    @property
    def is_admin(self):
        try:
            if hasattr(self, 'role') and hasattr(self, 'is_staff'):
                return self.role == 'admin' or self.is_staff
            return False
        except Exception as e:
            return False

class EmailVerificationToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['token', 'is_used']),
            models.Index(fields=['user', 'is_used']),
        ]
    
    def __str__(self):
        try:
            if hasattr(self, 'user') and self.user and hasattr(self.user, 'email'):
                return f"Verification token for {self.user.email}"
            return f"Verification token {self.id}"
        except Exception as e:
            return f"Verification token {self.id}"
    
    def is_expired(self):
        try:
            return timezone.now() > self.expires_at
        except:
            return True
    
    @classmethod
    def generate_token(cls):
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_for_user(cls, user):
        try:
            cls.objects.filter(user=user, is_used=False).update(is_used=True)
            
            token = cls.generate_token()
            expires_at = timezone.now() + timezone.timedelta(hours=24)
            
            return cls.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
        except Exception as e:
            print(f"Error creating verification token: {e}")
            return None

class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['token', 'is_used']),
            models.Index(fields=['user', 'is_used']),
        ]
    
    def __str__(self):
        try:
            if hasattr(self, 'user') and self.user and hasattr(self.user, 'email'):
                return f"Password reset token for {self.user.email}"
            return f"Password reset token {self.id}"
        except Exception as e:
            return f"Password reset token {self.id}"
    
    def is_expired(self):
        try:
            return timezone.now() > self.expires_at
        except:
            return True
    
    @classmethod
    def generate_token(cls):
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_for_user(cls, user):
        try:
            cls.objects.filter(user=user, is_used=False).update(is_used=True)
            
            token = cls.generate_token()
            expires_at = timezone.now() + timezone.timedelta(hours=1)
            
            return cls.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
        except Exception as e:
            print(f"Error creating password reset token: {e}")
            return None

class InvalidatedRefreshToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token_hash = models.CharField(max_length=128, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invalidated_tokens')
    invalidated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['token_hash']),
            models.Index(fields=['user', 'invalidated_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        try:
            if hasattr(self, 'user') and self.user and hasattr(self.user, 'username'):
                return f"Invalidated token for {self.user.username}"
            return f"Invalidated token {self.id}"
        except Exception as e:
            return f"Invalidated token {self.id}"
    
    @classmethod
    def is_invalidated(cls, token):
        try:
            import hashlib
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            return cls.objects.filter(token_hash=token_hash).exists()
        except Exception:
            return False
    
    @classmethod
    def invalidate_token(cls, token, user):
        try:
            import hashlib
            from rest_framework_simplejwt.tokens import RefreshToken
            
            refresh = RefreshToken(token)
            expires_at = refresh.lifetime + refresh.current_time
            
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            cls.objects.create(
                token_hash=token_hash,
                user=user,
                expires_at=expires_at
            )
            return True
        except Exception as e:
            print(f"Error invalidating token: {e}")
            return False
    
    @classmethod
    def cleanup_expired(cls):
        try:
            cls.objects.filter(expires_at__lt=timezone.now()).delete()
        except Exception as e:
            print(f"Error cleaning up expired tokens: {e}")

class Profile(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('followers_only', 'Followers Only'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=160, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    website = models.URLField(max_length=200, blank=True)
    location = models.CharField(max_length=100, blank=True)
    privacy = models.CharField(max_length=15, choices=PRIVACY_CHOICES, default='public')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        try:
            if hasattr(self, 'user') and self.user and hasattr(self.user, 'username'):
                return f"{self.user.username}'s Profile"
            return "User Profile"
        except Exception as e:
            return "User Profile"
    
    @property
    def followers_count(self):
        try:
            if hasattr(self, 'user') and self.user:
                if hasattr(self.user, 'followers_set'):
                    try:
                        return self.user.followers_set.filter(is_active=True).count()
                    except Exception as query_error:
                        print(f"Error querying followers_set: {query_error}")
                        return 0
                return 0
            return 0
        except Exception as e:
            print(f"Error getting followers_count: {e}")
            return 0
    
    @property
    def following_count(self):
        try:
            if hasattr(self, 'user') and self.user:
                if hasattr(self.user, 'following_set'):
                    try:
                        return self.user.following_set.filter(is_active=True).count()
                    except Exception as query_error:
                        print(f"Error querying following_set: {query_error}")
                        return 0
                return 0
            return 0
        except Exception as e:
            print(f"Error getting following_count: {e}")
            return 0
    
    @property
    def posts_count(self):
        try:
            if hasattr(self, 'user') and self.user:
                try:
                    from django.apps import apps
                    Post = apps.get_model('posts', 'Post')
                    if Post:
                        try:
                            return Post.objects.filter(author=self.user).count()
                        except Exception as query_error:
                            print(f"Error querying posts: {query_error}")
                            return 0
                    return 0
                except Exception as model_error:
                    print(f"Error getting Post model: {model_error}")
                    return 0
            return 0
        except Exception as e:
            print(f"Error getting posts_count: {e}")
            return 0
    
    def can_be_viewed_by(self, viewer):
        try:
            if not viewer or not hasattr(viewer, 'is_authenticated') or not viewer.is_authenticated:
                return getattr(self, 'privacy', 'public') == 'public'
            
            if hasattr(self, 'user') and self.user and viewer == self.user:
                return True
            
            privacy = getattr(self, 'privacy', 'public')
            if privacy == 'public':
                return True
            
            if privacy == 'followers_only':
                try:
                    from .models import Follow
                    if Follow and hasattr(self, 'user') and self.user:
                        try:
                            return Follow.objects.filter(follower=viewer, following=self.user, is_active=True).exists()
                        except Exception as query_error:
                            print(f"Error querying Follow model: {query_error}")
                            return False
                    return False
                except Exception as e:
                    print(f"Error checking followers_only privacy: {e}")
                    return False
            
            if privacy == 'private':
                return False
            
            return False
        except Exception as e:
            print(f"Error in can_be_viewed_by: {e}")
            return False

class Follow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower', 'created_at']),
            models.Index(fields=['following', 'created_at']),
        ]
    
    def __str__(self):
        try:
            if (hasattr(self, 'follower') and self.follower and hasattr(self.follower, 'username') and
                hasattr(self, 'following') and self.following and hasattr(self.following, 'username')):
                return f"{self.follower.username} follows {self.following.username}"
            return f"Follow relationship {self.id}"
        except Exception as e:
            return f"Follow relationship {self.id}"
    
    def clean(self):
        try:
            if self.follower == self.following:
                raise ValidationError("Users cannot follow themselves.")
        except Exception as e:
            print(f"Error in Follow.clean(): {e}")
    
    def save(self, *args, **kwargs):
        try:
            self.clean()
            super().save(*args, **kwargs)
        except Exception as e:
            print(f"Error in Follow.save(): {e}")
            super().save(*args, **kwargs)
