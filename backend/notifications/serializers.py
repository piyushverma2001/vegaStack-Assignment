from rest_framework import serializers
from .models import Notification
from users.serializers import UserBasicSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    recipient = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'notification_type', 
            'post', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'sender', 'created_at']

class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['recipient', 'sender', 'notification_type', 'post', 'message']
