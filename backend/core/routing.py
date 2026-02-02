"""
WebSocket routing configuration
"""
from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    path('ws/updates/', consumers.UpdatesConsumer.as_asgi()),
    path('ws/chat/<int:conversation_id>/', consumers.ChatConsumer.as_asgi()),
]
