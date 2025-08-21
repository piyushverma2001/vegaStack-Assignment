from django.contrib import admin
from .models import Post, Comment, Like


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'content', 'category', 'like_count', 'comment_count', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at', 'author']
    search_fields = ['content', 'author__username', 'author__email']
    ordering = ['-created_at']
    readonly_fields = ['like_count', 'comment_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Content', {'fields': ('author', 'content', 'image_url', 'category')}),
        ('Status', {'fields': ('is_active', 'like_count', 'comment_count')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'post', 'content', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'author']
    search_fields = ['content', 'author__username', 'post__content']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Content', {'fields': ('author', 'post', 'content')}),
        ('Status', {'fields': ('is_active',)}),
        ('Timestamps', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at', 'user', 'post__author']
    search_fields = ['user__username', 'post__content']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
