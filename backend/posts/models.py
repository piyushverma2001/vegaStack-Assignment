from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
import uuid

User = get_user_model()

class Post(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('announcement', 'Announcement'),
        ('question', 'Question'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=280)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    is_active = models.BooleanField(default=True)
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['author', 'created_at']),
            models.Index(fields=['category', 'created_at']),
        ]
    
    def __str__(self):
        try:
            if hasattr(self, 'author') and self.author and hasattr(self.author, 'username'):
                return f"{self.author.username}: {self.content[:50] if self.content else 'No content'}..."
            return f"Post {self.id}: {self.content[:50] if self.content else 'No content'}..."
        except Exception as e:
            return f"Post {self.id}"
    
    def update_counts(self):
        try:
            if hasattr(self, 'likes'):
                self.like_count = self.likes.filter(is_active=True).count()
            if hasattr(self, 'comments'):
                self.comment_count = self.comments.filter(is_active=True).count()
            self.save(update_fields=['like_count', 'comment_count'])
        except Exception as e:
            print(f"Error updating post counts: {e}")
    
    def save(self, *args, **kwargs):
        try:
            super().save(*args, **kwargs)
        except Exception as e:
            print(f"Error saving post: {e}")
            raise

class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.TextField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        try:
            if hasattr(self, 'author') and self.author and hasattr(self.author, 'username'):
                return f"{self.author.username}: {self.content[:30] if self.content else 'No content'}..."
            return f"Comment {self.id}: {self.content[:30] if self.content else 'No content'}..."
        except Exception as e:
            return f"Comment {self.id}"
    
    def save(self, *args, **kwargs):
        try:
            super().save(*args, **kwargs)
            if hasattr(self, 'post') and self.post:
                self.post.update_counts()
        except Exception as e:
            super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        try:
            if hasattr(self, 'post') and self.post:
                self.post.update_counts()
            super().delete(*args, **kwargs)
        except Exception as e:
            super().delete(*args, **kwargs)

class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']
    
    def __str__(self):
        try:
            if (hasattr(self, 'user') and self.user and hasattr(self.user, 'username') and
                hasattr(self, 'post') and self.post):
                return f"{self.user.username} likes {self.post.id}"
            return f"Like {self.id}"
        except Exception as e:
            return f"Like {self.id}"
    
    def save(self, *args, **kwargs):
        try:
            super().save(*args, **kwargs)
            if hasattr(self, 'post') and self.post:
                self.post.update_counts()
        except Exception as e:
            super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        try:
            if hasattr(self, 'post') and self.post:
                self.post.update_counts()
            super().delete(*args, **kwargs)
        except Exception as e:
            super().delete(*args, **kwargs)
