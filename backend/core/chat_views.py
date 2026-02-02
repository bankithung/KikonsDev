"""
Chat Views - API endpoints for real-time messaging with E2E encryption
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Max
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import User, ChatConversation, ChatMessage
from .encryption_service import MessageEncryptionService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get all conversations for the current user"""
    user = request.user
    
    # Get conversations where user is a participant
    conversations = ChatConversation.objects.filter(
        participants=user,
        company_id=user.company_id
    ).prefetch_related('participants', 'messages').annotate(
        last_message_time=Max('messages__timestamp')
    ).order_by('-last_message_time', '-updated_at')
    
    # Serialize conversations
    data = []
    for conv in conversations:
        # Get other participants (exclude current user)
        other_participants = conv.participants.exclude(id=user.id)
        
        # Get last message
        last_msg = conv.messages.order_by('-timestamp').first()
        
        # If it's a direct conversation (2 participants)
        if conv.participants.count() == 2 and not conv.is_group:
            other_user = other_participants.first()
            if other_user:
                conv_data = {
                    'id': str(conv.id),
                    'participantId': str(other_user.id),
                    'participantName': f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
                    'participantAvatar': other_user.avatar,
                    'participantRole': other_user.role,
                    'isGroup': False,
                    'unreadCount': 0,  # Calculate unread
                    'isOnline': True,  # Set to True for now (TODO: implement WebSocket presence tracking)
                    'lastMessage': '',  # Don't send encrypted content
                    'lastMessageTime': last_msg.timestamp.isoformat() if last_msg else None,
                }
                data.append(conv_data)
        # If it's a group conversation
        elif conv.is_group:
            group_info = getattr(conv, 'group_info', None)
            conv_data = {
                'id': str(conv.id),
                'participantName': group_info.group_name if group_info else 'Unnamed Group',
                'isGroup': True,
                'groupName': group_info.group_name if group_info else 'Unnamed Group',
                'groupAvatar': group_info.group_avatar if group_info else None,
                'memberIds': [str(p.id) for p in conv.participants.all()],
                'unreadCount': 0,
                'isOnline': True,
                'lastMessage': '',
                'lastMessageTime': last_msg.timestamp.isoformat() if last_msg else None,
            }
            data.append(conv_data)
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get all messages for a conversation (decrypted for current user)"""
    user = request.user
    
    # Verify user is participant
    conversation = get_object_or_404(
        ChatConversation, 
        id=conversation_id,
        participants=user
    )
    
    # Get messages
    messages = ChatMessage.objects.filter(
        conversation=conversation
    ).select_related('sender').order_by('timestamp')
    
    # Decrypt messages
    decrypted_messages = []
    user_private_key = user.rsa_private_key_encrypted
    
    for msg in messages:
        try:
            # Check if user has encryption keys AND message is encrypted
            if user_private_key and msg.encrypted_content and msg.encrypted_keys:
                # Get encrypted AES key for this user
                encrypted_aes_key = msg.encrypted_keys.get(str(user.id))
                
                if not encrypted_aes_key:
                    # User might have been added to conversation later, try plain text
                    print(f"Message {msg.id} has no encrypted key for user {user.id}, trying plain text")
                    if msg.text:
                        decrypted_content = msg.text
                    else:
                        continue
                else:
                    # Decrypt message
                    decrypted_content = MessageEncryptionService.decrypt_message(
                        msg.encrypted_content,
                        encrypted_aes_key,
                        user_private_key
                    )
            elif msg.text:
                # Fallback to legacy text field (for backward compatibility or no encryption keys)
                decrypted_content = msg.text
            else:
                # No content available at all
                print(f"Message {msg.id} has no content (no text and no encrypted_content)")
                continue
            
            decrypted_messages.append({
                'id': str(msg.id),
                'senderId': str(msg.sender.id),
                'senderName': f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username,
                'senderAvatar': msg.sender.avatar,
                'text': decrypted_content,
                'timestamp': msg.timestamp.isoformat(),
                'read': user.id in msg.read_by if msg.read_by else False,
            })
        except Exception as e:
            print(f"Error processing message {msg.id}: {e}")
            # Try fallback to legacy text field
            if msg.text:
                decrypted_messages.append({
                    'id': str(msg.id),
                    'senderId': str(msg.sender.id),
                    'senderName': f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username,
                    'senderAvatar': msg.sender.avatar,
                    'text': msg.text,
                    'timestamp': msg.timestamp.isoformat(),
                    'read': user.id in msg.read_by if msg.read_by else False,
                })
            continue
    
    return Response(decrypted_messages)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send an encrypted message"""
    user = request.user
    conversation_id = request.data.get('conversation_id')
    content = request.data.get('content')
    
    if not content:
        return Response(
            {'error': 'Message content is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get conversation
    conversation = get_object_or_404(
        ChatConversation,
        id=conversation_id,
        participants=user
    )
    
    # Get recipient public keys
    participants = conversation.participants.all()
    recipient_keys = {}
    encryption_available = True
    
    for participant in participants:
        if participant.rsa_public_key:
            recipient_keys[str(participant.id)] = participant.rsa_public_key
        else:
            encryption_available = False
            print(f"Warning: Participant {participant.username} (ID:{participant.id}) doesn't have encryption keys")
    
    # Only use encryption if ALL participants have keys
    if encryption_available and recipient_keys:
        # Encrypt message
        try:
            encrypted_data = MessageEncryptionService.encrypt_message(content, recipient_keys)
            
            # Save encrypted message
            message = ChatMessage.objects.create(
                conversation=conversation,
                sender=user,
                encrypted_content=encrypted_data['encrypted_content'],
                encrypted_keys=encrypted_data['encrypted_keys'],
                text=content,  # Store plain text as backup
                company_id=user.company_id,
                read_by=[user.id]
            )
        except Exception as e:
            print(f"Encryption failed: {str(e)}, falling back to plain text")
            # Fallback to plain text
            message = ChatMessage.objects.create(
                conversation=conversation,
                sender=user,
                text=content,
                encrypted_content='',
                encrypted_keys={},
                company_id=user.company_id,
                read_by=[user.id]
            )
    else:
        # Store as plain text (encryption keys not available for all participants)
        print(f"Storing message as plain text - encryption not available for all participants")
        message = ChatMessage.objects.create(
            conversation=conversation,
            sender=user,
            text=content,
            encrypted_content='',
            encrypted_keys={},
            company_id=user.company_id,
            read_by=[user.id]
        )
    
    # Update conversation timestamp
    conversation.updated_at = message.timestamp
    conversation.save()
    
    # Broadcast via WebSocket (if consumer is connected)
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation_id}',
            {
                'type': 'chat_message',
                'message': {
                    'id': str(message.id),
                    'senderId': str(user.id),
                    'senderName': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'senderAvatar': user.avatar,
                    'timestamp': message.timestamp.isoformat(),
                    # Don't send encrypted content via websocket for security
                    # Clients should fetch via API
                }
            }
        )
    
    # Return the message
    return Response({
        'id': str(message.id),
        'senderId': str(user.id),
        'senderName': f"{user.first_name} {user.last_name}".strip() or user.username,
        'senderAvatar': user.avatar,
        'text': content,  # Return the original content
        'timestamp': message.timestamp.isoformat(),
        'read': True,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """Create a new conversation with specified participants"""
    user = request.user
    participant_ids = request.data.get('participant_ids', [])
    
    if not participant_ids:
        return Response(
            {'error': 'At least one participant is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Include current user in participants
    all_participant_ids = set([user.id] + [int(pid) for pid in participant_ids])
    
    # Check if conversation already exists (for direct messages)
    if len(all_participant_ids) == 2:
        existing = ChatConversation.objects.filter(
            is_group=False,
            company_id=user.company_id
        )
        for conv in existing:
            conv_participant_ids = set(conv.participants.values_list('id', flat=True))
            if conv_participant_ids == all_participant_ids:
                return Response({
                    'id': str(conv.id),
                    'exists': True
                })
    
    # Create new conversation
    conversation = ChatConversation.objects.create(
        company_id=user.company_id,
        is_group=len(all_participant_ids) > 2
    )
    
    # Add participants
    participants = User.objects.filter(id__in=all_participant_ids)
    conversation.participants.set(participants)
    
    return Response({
        'id': str(conversation.id),
        'exists': False
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, message_id):
    """Mark a message as read by current user"""
    user = request.user
    
    message = get_object_or_404(ChatMessage, id=message_id)
    
    # Add user to read_by list if not already there
    if user.id not in message.read_by:
        message.read_by.append(user.id)
        message.save()
    
    return Response({'status': 'success'})
