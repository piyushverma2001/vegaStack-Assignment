from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification admin interface"""
    list_display = ['id', 'recipient', 'sender', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at', 'recipient', 'sender']
    search_fields = ['recipient__username', 'sender__username', 'message']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Notification Details', {'fields': ('recipient', 'sender', 'notification_type', 'post')}),
        ('Content', {'fields': ('message', 'is_read')}),
        ('Timestamps', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )
    
    def has_add_permission(self, request):
        return False
