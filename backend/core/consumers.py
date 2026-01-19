"""
WebSocket consumer for real-time updates
"""
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

# Global dictionary to track online users by company
# Format: {company_id: set(user_ids)}
online_users = {}


class UpdatesConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer that handles real-time updates for a company.
    Employees join a room based on their company_id to receive updates.
    Tracks online users and broadcasts count to admins.
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get user from scope (added by AuthMiddleware)
        self.user = self.scope.get('user')
        
        # Only allow authenticated users
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Get company_id for this user
        self.company_id = await self.get_company_id()
        self.user_role = await self.get_user_role()
        
        if not self.company_id:
            # DEV_ADMIN doesn't have company_id, use special room
            self.room_name = 'dev_admin'
        else:
            self.room_name = f'company_{self.company_id}'
        
        self.room_group_name = f'updates_{self.room_name}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Track this user as online
        await self.mark_user_online()
        
        # Send connection confirmation
        await self.send_json({
            'type': 'connection_established',
            'message': 'Connected to real-time updates'
        })
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Mark user as offline
        await self.mark_user_offline()
        
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive_json(self, content):
        """Handle messages from WebSocket (ping/pong for keep-alive)"""
        if content.get('type') == 'ping':
            await self.send_json({'type': 'pong'})
        elif content.get('type') == 'get_online_count':
            # Admin requesting online count
            count = await self.get_online_count()
            await self.send_json({
                'type': 'online_count',
                'count': count
            })
    
    async def broadcast_update(self, event):
        """
        Handle broadcast_update events from channel layer.
        Forward the event to WebSocket client.
        """
        await self.send_json({
            'type': 'update',
            'entity': event['entity'],  # e.g., 'enquiry', 'registration'
            'action': event['action'],  # e.g., 'created', 'updated', 'deleted'
            'data': event['data']
        })
    
    async def online_count_update(self, event):
        """Handle online count update broadcast"""
        await self.send_json({
            'type': 'online_count',
            'count': event['count']
        })
    
    async def mark_user_online(self):
        """Mark user as online and broadcast updated count"""
        global online_users
        company_key = self.company_id or 'dev_admin'
        
        if company_key not in online_users:
            online_users[company_key] = set()
        
        online_users[company_key].add(self.user.id)
        
        # Broadcast updated count to company
        await self.broadcast_online_count()
    
    async def mark_user_offline(self):
        """Mark user as offline and broadcast updated count"""
        global online_users
        company_key = getattr(self, 'company_id', None) or 'dev_admin'
        
        if company_key in online_users and hasattr(self, 'user'):
            online_users[company_key].discard(self.user.id)
            
            # Broadcast updated count to company
            await self.broadcast_online_count()
    
    async def broadcast_online_count(self):
        """Broadcast current online count to all users in the company"""
        count = await self.get_online_count()
        
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'online_count_update',
                    'count': count
                }
            )
    
    async def get_online_count(self):
        """Get current online user count for this company"""
        global online_users
        company_key = getattr(self, 'company_id', None) or 'dev_admin'
        return len(online_users.get(company_key, set()))
    
    @database_sync_to_async
    def get_company_id(self):
        """Get company_id for the current user"""
        try:
            user = User.objects.get(id=self.user.id)
            return user.company_id
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_user_role(self):
        """Get role for the current user"""
        try:
            user = User.objects.get(id=self.user.id)
            return user.role
        except User.DoesNotExist:
            return None

