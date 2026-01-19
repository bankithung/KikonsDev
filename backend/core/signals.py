"""
Django signals for broadcasting real-time updates
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    Enquiry, Registration, Enrollment, Payment,
    Document, Task, Appointment, Notification,
    FollowUp, User, ActivityLog, Earning
)


def broadcast_event(entity_type, action, instance, company_id=None):
    """
    Broadcast an event to all WebSocket connections in the same company room.
    
    Args:
        entity_type: Type of entity (e.g., 'enquiry', 'registration')
        action: Action performed ('created', 'updated', 'deleted')
        instance: The model instance
        company_id: Company ID to broadcast to (None for all)
    """
    channel_layer = get_channel_layer()
    
    if not channel_layer:
        return
    
    # Determine which room to broadcast to
    if company_id:
        room_group_name = f'updates_company_{company_id}'
    else:
        room_group_name = 'updates_dev_admin'
    
    # Prepare event data
    event_data = {
        'type': 'broadcast_update',
        'entity': entity_type,
        'action': action,
        'data': {
            'id': instance.id if hasattr(instance, 'id') else None,
        }
    }
    
    # Broadcast to room
    try:
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            event_data
        )
    except Exception as e:
        print(f"Error broadcasting event: {e}")


# Enquiry signals
@receiver(post_save, sender=Enquiry)
def enquiry_saved(sender, instance, created, **kwargs):
    """Broadcast when enquiry is created or updated"""
    action = 'created' if created else 'updated'
    # Enquiries don't have company_id, broadcast to all
    broadcast_event('enquiry', action, instance, company_id=instance.company_id)

@receiver(post_delete, sender=Enquiry)
def enquiry_deleted(sender, instance, **kwargs):
    """Broadcast when enquiry is deleted"""
    broadcast_event('enquiry', 'deleted', instance, company_id=instance.company_id)


# Registration signals
@receiver(post_save, sender=Registration)
def registration_saved(sender, instance, created, **kwargs):
    """Broadcast when registration is created or updated"""
    action = 'created' if created else 'updated'
    # Create Activity Log and Earning
    if created and instance.created_by:
        ActivityLog.objects.create(
            user=instance.created_by,
            action_type="CREATE",
            description=f"Created new registration for {instance.student_name}",
            company_id=instance.created_by.company_id
        )
        # Add Commission Earning (Registration Fee)
        # Check if registration_fee is valid
        reg_fee = instance.registration_fee if instance.registration_fee else 0
        if reg_fee > 0:
            Earning.objects.create(
                user=instance.created_by,
                amount=reg_fee,
                source_type="registration",
                source_id=str(instance.id),
                description=f"Registration Fee: {instance.student_name}",
                date=instance.created_at.date() if hasattr(instance, 'created_at') else None,
                company_id=instance.created_by.company_id
            )

    broadcast_event('registration', action, instance, company_id=instance.company_id)


@receiver(post_delete, sender=Registration)
def registration_deleted(sender, instance, **kwargs):
    """Broadcast when registration is deleted"""
    broadcast_event('registration', 'deleted', instance, company_id=instance.company_id)


# Enrollment signals
@receiver(post_save, sender=Enrollment)
def enrollment_saved(sender, instance, created, **kwargs):
    """Broadcast when enrollment is created or updated"""
    action = 'created' if created else 'updated'
    # Create Activity Log and Earning
    if created and instance.created_by:
        ActivityLog.objects.create(
            user=instance.created_by,
            action_type="CREATE",
            description=f"Enrolled student: {instance.student.student_name} in {instance.program_name}",
            company_id=instance.created_by.company_id
        )
        # Add Commission Earning
        comm_amt = instance.commission_amount if instance.commission_amount else 0
        if comm_amt > 0:
            Earning.objects.create(
                user=instance.created_by,
                amount=comm_amt,
                source_type="enrollment",
                source_id=str(instance.id),
                description=f"Commission for enrollment: {instance.student.student_name}",
                date=instance.start_date,
                company_id=instance.created_by.company_id
            )

    broadcast_event('enrollment', action, instance, company_id=instance.company_id)


@receiver(post_delete, sender=Enrollment)
def enrollment_deleted(sender, instance, **kwargs):
    """Broadcast when enrollment is deleted"""
    broadcast_event('enrollment', 'deleted', instance, company_id=instance.company_id)


# Payment signals
@receiver(post_save, sender=Payment)
def payment_saved(sender, instance, created, **kwargs):
    """Broadcast when payment is created or updated"""
    action = 'created' if created else 'updated'
    broadcast_event('payment', action, instance, company_id=instance.company_id)


@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    """Broadcast when payment is deleted"""
    broadcast_event('payment', 'deleted', instance, company_id=instance.company_id)


# Document signals
@receiver(post_save, sender=Document)
def document_saved(sender, instance, created, **kwargs):
    """Broadcast when document is created or updated"""
    action = 'created' if created else 'updated'
    broadcast_event('document', action, instance, company_id=instance.company_id)


@receiver(post_delete, sender=Document)
def document_deleted(sender, instance, **kwargs):
    """Broadcast when document is deleted"""
    broadcast_event('document', 'deleted', instance, company_id=instance.company_id)


# Task signals
@receiver(post_save, sender=Task)
def task_saved(sender, instance, created, **kwargs):
    """Broadcast when task is created or updated"""
    action = 'created' if created else 'updated'
    # Create Activity Log
    if created and instance.assigned_to:
        ActivityLog.objects.create(
            user=instance.assigned_to,
            action_type="TASK_ASSIGNED",
            description=f"New task assigned: {instance.title}",
            company_id=instance.company_id
        )
    elif not created:
         ActivityLog.objects.create(
            user=instance.assigned_to,
            action_type="TASK_UPDATE",
            description=f"Task updated: {instance.title} (Status: {instance.status})",
            company_id=instance.company_id
        )

    broadcast_event('task', action, instance, company_id=instance.company_id)


@receiver(post_delete, sender=Task)
def task_deleted(sender, instance, **kwargs):
    """Broadcast when task is deleted"""
    broadcast_event('task', 'deleted', instance, company_id=instance.company_id)


# FollowUp signals
@receiver(post_save, sender=FollowUp)
def followup_saved(sender, instance, created, **kwargs):
    """Broadcast when follow-up is created or updated"""
    action = 'created' if created else 'updated'
    broadcast_event('followup', action, instance, company_id=instance.company_id)


@receiver(post_delete, sender=FollowUp)
def followup_deleted(sender, instance, **kwargs):
    """Broadcast when follow-up is deleted"""
    broadcast_event('followup', 'deleted', instance, company_id=instance.company_id)


# Notification signals (only broadcast created, as they're usually not updated/deleted)
@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    """Broadcast when notification is created"""
    if created:
        # Get user's company_id
        company_id = instance.user.company_id if hasattr(instance.user, 'company_id') else None
        broadcast_event('notification', 'created', instance, company_id=company_id)


# User signals (for user management updates)
@receiver(post_save, sender=User)
def user_saved(sender, instance, created, **kwargs):
    """Broadcast when user is created or updated"""
    action = 'created' if created else 'updated'
    company_id = instance.company_id
    broadcast_event('user', action, instance, company_id=company_id)


@receiver(post_delete, sender=User)
def user_deleted(sender, instance, **kwargs):
    """Broadcast when user is deleted"""
    company_id = instance.company_id
    broadcast_event('user', 'deleted', instance, company_id=company_id)


# NEW: Chat Signals
from .models import ChatConversation, ChatMessage, GroupChat

@receiver(post_save, sender=ChatConversation)
def chat_conversation_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('chat_conversation', action, instance, company_id=instance.company_id)

@receiver(post_save, sender=ChatMessage)
def chat_message_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('chat_message', action, instance, company_id=instance.company_id)

@receiver(post_save, sender=GroupChat)
def group_chat_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('group_chat', action, instance, company_id=instance.company_id)


# NEW: Physical Document Transfer Signals
from .models import PhysicalDocumentTransfer, TransferTimeline, DocumentTransfer

@receiver(post_save, sender=PhysicalDocumentTransfer)
def physical_transfer_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('physical_transfer', action, instance, company_id=instance.company_id)

@receiver(post_save, sender=PhysicalDocumentTransfer)
def physical_transfer_deleted(sender, instance, **kwargs):
    broadcast_event('physical_transfer', 'deleted', instance, company_id=instance.company_id)

@receiver(post_save, sender=TransferTimeline)
def transfer_timeline_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    # TransferTimeline uses company_id provided in model
    broadcast_event('transfer_timeline', action, instance, company_id=instance.company_id)

@receiver(post_save, sender=DocumentTransfer)
def digital_transfer_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('digital_transfer', action, instance, company_id=instance.company_id)


# NEW: Student Remarks
from .models import StudentRemark

@receiver(post_save, sender=StudentRemark)
def remark_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('student_remark', action, instance, company_id=instance.company_id)


# NEW: Appointments
from .models import Appointment

@receiver(post_save, sender=Appointment)
def appointment_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('appointment', action, instance, company_id=instance.company_id)

@receiver(post_delete, sender=Appointment)
def appointment_deleted(sender, instance, **kwargs):
    broadcast_event('appointment', 'deleted', instance, company_id=instance.company_id)


# NEW: Earnings/Revenue
from .models import Earning

@receiver(post_save, sender=Earning)
def earning_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('earning', action, instance, company_id=instance.company_id)


# NEW: Approvals
from .models import ApprovalRequest, SignupRequest

@receiver(post_save, sender=ApprovalRequest)
def approval_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('approval_request', action, instance, company_id=instance.company_id)

@receiver(post_save, sender=SignupRequest)
def signup_saved(sender, instance, created, **kwargs):
    # Signups often have company_id blank initially, but we try:
    company_id = instance.company_id if instance.company_id else None
    broadcast_event('signup_request', 'created' if created else 'updated', instance, company_id=company_id)


# NEW: Company
from .models import Company

@receiver(post_save, sender=Company)
def company_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('company', action, instance, company_id=instance.company_id)


# NEW: Template
from .models import Template

@receiver(post_save, sender=Template)
def template_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    broadcast_event('template', action, instance, company_id=instance.company_id)


# NEW: Refund (Assuming Refund model exists based on earlier grep, adding import if model exists, else skip)
# from .models import Refund # Wait, I didn't see Refund in file view range. Skipping to avoid error.

