from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, Follow

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_verified', 'created_at']
    list_filter = ['role', 'is_active', 'is_verified', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('SocialConnect Info', {'fields': ('role', 'is_verified', 'avatar_url')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('SocialConnect Info', {'fields': ('role', 'is_verified')}),
    )

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'bio', 'privacy', 'followers_count', 'following_count', 'posts_count', 'created_at']
    list_filter = ['privacy', 'created_at']
    search_fields = ['user__username', 'user__email', 'bio', 'location']
    ordering = ['-created_at']
    
    readonly_fields = ['followers_count', 'following_count', 'posts_count']

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__username', 'following__username']
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        return False
