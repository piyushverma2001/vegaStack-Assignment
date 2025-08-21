from rest_framework import serializers
from .models import Post, Comment, Like
from users.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

class AdminCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    post = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'post', 'created_at']
        read_only_fields = ['id', 'author', 'post', 'created_at']
    
    def get_post(self, obj):
        if obj.post:
            return {
                'id': obj.post.id,
                'content': obj.post.content[:100] + '...' if len(obj.post.content) > 100 else obj.post.content
            }
        return None

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'content', 'image_url', 'category', 'author',
                 'is_active', 'like_count', 'comment_count', 'created_at', 'updated_at',
                 'is_liked_by_user']
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['content', 'image_url', 'category']
    
    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Post content cannot be empty.")
        if len(value) > 280:
            raise serializers.ValidationError("Post content cannot exceed 280 characters.")
        return value
    
    def validate_image_url(self, value):
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("Image URL must be a valid HTTP/HTTPS URL.")
        return value

class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['content', 'image_url', 'category']
    
    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Post content cannot be empty.")
        if len(value) > 280:
            raise serializers.ValidationError("Post content cannot exceed 280 characters.")
        return value
    
    def validate_image_url(self, value):
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("Image URL must be a valid HTTP/HTTPS URL.")
        return value
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        return instance

class PostDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'content', 'image_url', 'category', 'author',
                 'is_active', 'like_count', 'comment_count', 'created_at', 'updated_at',
                 'comments', 'is_liked_by_user']
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

class CommentCreateSerializer(serializers.ModelSerializer):    
    class Meta:
        model = Comment
        fields = ['content']
    
    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Comment content cannot be empty.")
        if len(value) > 200:
            raise serializers.ValidationError("Comment content cannot exceed 200 characters.")
        return value

class LikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['id', 'user', 'post', 'created_at']

class FeedPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'content', 'image_url', 'category', 'author', 
                 'like_count', 'comment_count', 'is_liked_by_user',
                 'created_at']
        read_only_fields = ['id', 'author', 'like_count', 'comment_count', 'created_at']
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
