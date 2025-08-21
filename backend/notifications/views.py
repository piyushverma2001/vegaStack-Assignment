from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Notification
from .serializers import NotificationSerializer

from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
import json
import time

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender', 'post')
    
    def get(self, request):
        notifications = self.get_queryset()
        
        unread_notifications = notifications.filter(is_read=False)
        unread_count = unread_notifications.count()
        if unread_notifications.exists():
            unread_notifications.update(is_read=True)
        
        serializer = self.get_serializer(notifications, many=True)
        response = Response(serializer.data)
        
        response['X-Unread-Count'] = str(unread_count)
        
        return response


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})


class MarkAllNotificationsReadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class UnreadNotificationCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({'unread_count': unread_count})

class NotificationPreferencesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        preferences = {
            'follow_notifications': True,
            'like_notifications': True,
            'comment_notifications': True,
            'email_notifications': False,
            'push_notifications': True,
        }
        return Response(preferences)
    
    def put(self, request):
        preferences = request.data
        return Response({
            'message': 'Notification preferences updated successfully',
            'preferences': preferences
        })

class NotificationSSEView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        def event_stream():
            yield f"data: {json.dumps({'type': 'connection', 'message': 'Connected to notification stream'})}\n\n"
            
            last_notification_time = time.time()
            last_heartbeat_time = time.time()
            
            while True:
                try:
                    current_time = time.time()
                    
                    if current_time - last_notification_time >= 1:
                        new_notifications = Notification.objects.filter(
                            recipient=request.user,
                            created_at__gt=timezone.now() - timezone.timedelta(seconds=2)
                        ).select_related('sender', 'post')[:5]
                        
                        for notification in new_notifications:
                            notification_data = {
                                'type': 'new_notification',
                                'notification': {
                                    'id': str(notification.id),
                                    'sender': {
                                        'username': notification.sender.username,
                                        'first_name': notification.sender.first_name,
                                        'last_name': notification.sender.last_name,
                                    },
                                    'notification_type': notification.notification_type,
                                    'message': notification.message,
                                    'is_read': notification.is_read,
                                    'created_at': notification.created_at.isoformat(),
                                    'post': {
                                        'id': str(notification.post.id)
                                    } if notification.post else None,
                                }
                            }
                            yield f"data: {json.dumps(notification_data)}\n\n"
                        
                        last_notification_time = current_time
                    
                    if current_time - last_heartbeat_time >= 5:
                        unread_count = Notification.objects.filter(
                            recipient=request.user,
                            is_read=False
                        ).count()
                        
                        yield f"data: {json.dumps({'type': 'heartbeat', 'unread_count': unread_count})}\n\n"
                        last_heartbeat_time = current_time
                    
                    time.sleep(0.5)
                    
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response
