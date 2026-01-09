from rest_framework import viewsets
from .models import (
    User, Enquiry, Registration, Enrollment, Payment, Document,
    StudentDocument, DocumentTransfer, Task, Appointment, University, Template,
    Notification, Commission, Refund, LeadSource, VisaTracking, FollowUp,
    Installment, Agent, ChatConversation, ChatMessage, GroupChat, SignupRequest,
    ApprovalRequest, Company
)
from .serializers import (
    UserSerializer, EnquirySerializer, RegistrationSerializer, 
    EnrollmentSerializer, PaymentSerializer, DocumentSerializer,
    StudentDocumentSerializer, DocumentTransferSerializer, TaskSerializer, AppointmentSerializer,
    UniversitySerializer, TemplateSerializer, NotificationSerializer,
    CommissionSerializer, RefundSerializer, LeadSourceSerializer,
    VisaTrackingSerializer, FollowUpSerializer, InstallmentSerializer,
    AgentSerializer, ChatConversationSerializer, ChatMessageSerializer,

    GroupChatSerializer, SignupRequestSerializer, ApprovalRequestSerializer,
    CompanySerializer
)

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models.functions import Concat
from django.db.models import Count, Sum, Avg, Q, F, Value

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        company_id = request.user.company_id
        if not company_id:
            return Response({'error': 'No company associated with user'}, status=404)
        
        company = Company.objects.filter(company_id=company_id).first()
        if not company:
            # Auto-create if not found but user has company_id (safe fallback)
            company = Company.objects.create(name=company_id, company_id=company_id)
            
        serializer = self.get_serializer(company)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # DEV_ADMIN sees all users
        if user.role == 'DEV_ADMIN':
            return User.objects.all()
        # COMPANY_ADMIN, MANAGER, and EMPLOYEE see only their company's users
        elif user.role in ['COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE']:
            return User.objects.filter(company_id=user.company_id)
        # Fallback
        return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        # Auto-assign company_id from the requesting user (unless DEV_ADMIN)
        if self.request.user.role != 'DEV_ADMIN':
            serializer.save(company_id=self.request.user.company_id)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def counselors_analytics(self, request):
        """Get performance analytics for all counselors"""
        counselors = User.objects.filter(role='EMPLOYEE')
        analytics = []
        
        for counselor in counselors:
            # Get active enquiries assigned to this counselor
            active_enquiries = Enquiry.objects.filter(status='New').count()
            
            # Get this month's conversions (enquiries converted to registrations)
            this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
            month_conversions = Enquiry.objects.filter(
                status='Converted',
                date__gte=this_month_start
            ).count()
            
            # Calculate conversion rate
            total_enquiries = Enquiry.objects.count()
            converted = Enquiry.objects.filter(status='Converted').count()
            conversion_rate = (converted / total_enquiries * 100) if total_enquiries > 0 else 0
            
            analytics.append({
                'id': counselor.id,
                'name': counselor.username,
                'email': counselor.email,
                'avatar': counselor.avatar,
                'activeEnquiries': active_enquiries,
                'thisMonthConversions': month_conversions,
                'conversionRate': round(conversion_rate, 1),
                'avgResponseTime': '2.5',  # Mock for now
                'status': 'Available'  # Mock for now
            })
        
        return Response(analytics)

class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, company_id=self.request.user.company_id)
    
    def update(self, request, *args, **kwargs):
        # Check if user is an employee
        if request.user.role == 'EMPLOYEE':
            return Response({
                'error': 'Employees cannot edit directly. Please submit an approval request instead.'
            }, status=403)
        
        # Admins can edit directly
        return super().update(request, *args, **kwargs)

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all().order_by('-created_at')
    serializer_class = RegistrationSerializer
    
    def perform_create(self, serializer):
        # Save registration with company_id and created_by
        instance = serializer.save(company_id=self.request.user.company_id, created_by=self.request.user)
        
        # Auto-create payment
        if instance.registration_fee > 0:
            Payment.objects.create(
                student_name=instance.student_name,
                amount=instance.registration_fee,
                type='Registration',
                status='Success',
                method='Cash', # Default
                company_id=instance.company_id
            )
        
        # Handle Student Documents
        student_documents = self.request.data.get('student_documents', [])
        if student_documents:
            for doc in student_documents:
                StudentDocument.objects.create(
                    registration=instance,
                    name=doc.get('name'),
                    document_number=doc.get('document_number', ''),
                    status='Held',
                    remarks=doc.get('remarks', ''),
                    company_id=instance.company_id,
                    created_by=self.request.user
                )
    
    def update(self, request, *args, **kwargs):
        # Check if user is an employee
        if request.user.role == 'EMPLOYEE':
            return Response({
                'error': 'Employees cannot edit directly. Please submit an approval request instead.'
            }, status=403)
        
        # Admins can edit directly
        return super().update(request, *args, **kwargs)

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def perform_create(self, serializer):
        # Save enrollment with company_id and created_by
        instance = serializer.save(company_id=self.request.user.company_id, created_by=self.request.user)
        
        # Handle Student Documents (taken during enrollment)
        student_documents = self.request.data.get('student_documents', [])
        if student_documents:
            from .models import StudentDocument
            for doc in student_documents:
                StudentDocument.objects.create(
                    registration=instance.student, # Link to the student registration
                    name=doc.get('name'),
                    document_number=doc.get('document_number', ''),
                    status='Held',
                    remarks=doc.get('remarks', ''),
                    company_id=instance.company_id,
                    created_by=self.request.user
                )

    def update(self, request, *args, **kwargs):
        
        # Auto-create payment
        if instance.total_fees > 0:
            Payment.objects.create(
                student_name=instance.student.student_name,
                amount=instance.total_fees,
                type='Enrollment',
                status='Success',
                method='Cash', # Default
                company_id=instance.company_id
            )
    
    def update(self, request, *args, **kwargs):
        # Check if user is an employee
        if request.user.role == 'EMPLOYEE':
            return Response({
                'error': 'Employees cannot edit directly. Please submit an approval request instead.'
            }, status=403)
        
        # Admins can edit directly
        return super().update(request, *args, **kwargs)

class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get payment statistics"""
        total_revenue = Payment.objects.filter(status='Success').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # This month revenue
        this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
        month_revenue = Payment.objects.filter(
            status='Success',
            date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Pending amount
        pending = Payment.objects.filter(status='Pending').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Transaction count
        transaction_count = Payment.objects.filter(status='Success').count()
        
        return Response({
            'totalRevenue': total_revenue,
            'thisMonthRevenue': month_revenue,
            'pendingAmount': pending,
            'transactionCount': transaction_count
        })

class RefundViewSet(viewsets.ModelViewSet):
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        student_name = self.request.query_params.get('student_name')
        if student_name:
            queryset = queryset.filter(student_name__icontains=student_name)
        return queryset.order_by('-refund_date')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        refund = self.get_object()
        if refund.status != 'Pending':
            return Response({'error': 'Only pending refunds can be approved'}, status=400)
        refund.status = 'Approved'
        refund.approved_by = request.user
        refund.processed_at = timezone.now()
        refund.save()
        return Response(RefundSerializer(refund).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        refund = self.get_object()
        if refund.status != 'Pending':
            return Response({'error': 'Only pending refunds can be rejected'}, status=400)
        refund.status = 'Rejected'
        refund.approved_by = request.user
        refund.processed_at = timezone.now()
        refund.rejection_reason = request.data.get('reason', '')
        refund.save()
        return Response(RefundSerializer(refund).data)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user, current_holder=self.request.user)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get documents expiring in next 30 days"""
        thirty_days_later = timezone.now().date() + timedelta(days=30)
        expiring = Document.objects.filter(
            expiry_date__lte=thirty_days_later,
            expiry_date__gte=timezone.now().date()
        ).order_by('expiry_date')
        
        serializer = self.get_serializer(expiring, many=True)
        documents = serializer.data
        
        # Add days until expiry
        for doc in documents:
            if doc.get('expiry_date'):
                expiry = datetime.strptime(doc['expiry_date'], '%Y-%m-%d').date()
                days_until = (expiry - timezone.now().date()).days
                doc['daysUntilExpiry'] = days_until
        
        return Response(documents)

class DocumentTransferViewSet(viewsets.ModelViewSet):
    queryset = DocumentTransfer.objects.all()
    serializer_class = DocumentTransferSerializer
    pagination_class = None  # Disable pagination for transfers

    def get_queryset(self):
        user = self.request.user
        # Return transfers where user is either sender or receiver
        # Also filter by company
        if user.role == 'DEV_ADMIN':
            return DocumentTransfer.objects.all().select_related('sender', 'receiver').prefetch_related('documents')
        else:
            return DocumentTransfer.objects.filter(
                Q(sender__company_id=user.company_id) |
                Q(receiver__company_id=user.company_id)
            ).select_related('sender', 'receiver').prefetch_related('documents')

    def perform_create(self, serializer):
        instance = serializer.save(sender=self.request.user)
        # Send notification to receiver
        Notification.objects.create(
            user=instance.receiver,
            title='New Document Transfer',
            message=f'{self.request.user.username} has sent you documents.',
            type='info'
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'Pending':
            return Response({'error': 'Transfer already processed'}, status=400)
        
        if request.user != transfer.receiver:
            return Response({'error': 'Not authorized'}, status=403)

        transfer.status = 'Accepted'
        transfer.accepted_at = timezone.now()
        transfer.save()

        # Update documents holder
        for doc in transfer.documents.all():
            doc.current_holder = request.user
            doc.save()

        # Notify sender
        Notification.objects.create(
            user=transfer.sender,
            title='Transfer Accepted',
            message=f'{request.user.username} accepted your document transfer.',
            type='success'
        )
        
        return Response({'status': 'accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'Pending':
            return Response({'error': 'Transfer already processed'}, status=400)

        if request.user != transfer.receiver:
            return Response({'error': 'Not authorized'}, status=403)

        transfer.status = 'Rejected'
        transfer.save()

        # Notify sender
        Notification.objects.create(
            user=transfer.sender,
            title='Transfer Rejected',
            message=f'{request.user.username} rejected your document transfer.',
            type='error'
        )
        
        return Response({'status': 'rejected'})

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DEV_ADMIN':
            return Task.objects.all()
        return Task.objects.filter(company_id=user.company_id)

    def perform_create(self, serializer):
        instance = serializer.save(company_id=self.request.user.company_id)
        
        # Create Notification for the assigned user
        Notification.objects.create(
            user=instance.assigned_to,
            title='New Task Assigned',
            message=f'You have been assigned a new task: {instance.title}',
            type='Info',
            action_url='/app/tasks'
        )

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    
    @action(detail=False, methods=['get'])
    def calendar_view(self, request):
        """Get appointments formatted for calendar view"""
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        if month and year:
            appointments = Appointment.objects.filter(
                date__year=year,
                date__month=month
            )
        else:
            appointments = Appointment.objects.all()
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)


class StudentDocumentViewSet(viewsets.ModelViewSet):
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        registration_id = self.request.query_params.get('registration_id')
        if registration_id:
            queryset = queryset.filter(registration_id=registration_id)
        return queryset

    @action(detail=False, methods=['post'])
    def return_docs(self, request):
        doc_ids = request.data.get('doc_ids', [])
        if not doc_ids:
            return Response({'error': 'No document IDs provided'}, status=400)
        
        docs = StudentDocument.objects.filter(id__in=doc_ids)
        updated_count = docs.update(
            status='Returned',
            returned_at=timezone.now(),
            remarks=Conact(F('remarks'), Value(f'\nReturned on {timezone.now().date()}'))
        )
        return Response({'message': f'{updated_count} documents returned successfully'})

class UniversityViewSet(viewsets.ModelViewSet):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer

class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class CommissionViewSet(viewsets.ModelViewSet):
    queryset = Commission.objects.all()
    serializer_class = CommissionSerializer

class RefundViewSet(viewsets.ModelViewSet):
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer

class LeadSourceViewSet(viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer

class VisaTrackingViewSet(viewsets.ModelViewSet):
    queryset = VisaTracking.objects.all()
    serializer_class = VisaTrackingSerializer

class FollowUpViewSet(viewsets.ModelViewSet):
    queryset = FollowUp.objects.all()
    serializer_class = FollowUpSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, company_id=self.request.user.company_id)

# New ViewSets
class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

class ChatConversationViewSet(viewsets.ModelViewSet):
    queryset = ChatConversation.objects.all()
    serializer_class = ChatConversationSerializer
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a conversation"""
        conversation = self.get_object()
        messages = conversation.messages.all().order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

class GroupChatViewSet(viewsets.ModelViewSet):
    queryset = GroupChat.objects.all()
    serializer_class = GroupChatSerializer

class SignupRequestViewSet(viewsets.ModelViewSet):
    queryset = SignupRequest.objects.all()
    serializer_class = SignupRequestSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a signup request and create the user account"""
        signup_request = self.get_object()
        
        # Only DEV_ADMIN can approve
        if request.user.role != 'DEV_ADMIN':
            return Response(
                {'error': 'Only DEV_ADMIN can approve signup requests'},
                status=403
            )
        
        # Check if already processed
        if signup_request.status != 'Pending':
            return Response(
                {'error': f'This request has already been {signup_request.status.lower()}'},
                status=400
            )
        
        try:
            # Create the company admin user
            user = User.objects.create(
                username=signup_request.username,
                email=signup_request.email,
                password=signup_request.password,  # Already hashed in serializer
                first_name=signup_request.first_name,
                last_name=signup_request.last_name,
                role='COMPANY_ADMIN',
                company_id=signup_request.company_id,
                is_staff=False,
                is_superuser=False
            )
            
            # Update signup request status
            signup_request.status = 'Approved'
            signup_request.approved_by = request.user
            signup_request.approved_at = timezone.now()
            signup_request.save()
            
            # Create a notification for the new user (if notification system is set up)
            Notification.objects.create(
                user=user,
                title='Account Approved',
                message=f'Your {signup_request.company_name} company admin account has been approved!',
                type='Success'
            )
            
            return Response({
                'message': 'Signup request approved successfully',
                'user_id': user.id,
                'username': user.username
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=500
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a signup request"""
        signup_request = self.get_object()
        
        # Only DEV_ADMIN can reject
        if request.user.role != 'DEV_ADMIN':
            return Response(
                {'error': 'Only DEV_ADMIN can reject signup requests'},
                status=403
            )
        
        # Check if already processed
        if signup_request.status != 'Pending':
            return Response(
                {'error': f'This request has already been {signup_request.status.lower()}'},
                status=400
            )
        
        # Get rejection reason from request body
        reason = request.data.get('reason', 'No reason provided')
        
        # Update signup request
        signup_request.status = 'Rejected'
        signup_request.approved_by = request.user
        signup_request.approved_at = timezone.now()
        signup_request.rejection_reason = reason
        signup_request.save()
        
        return Response({
            'message': 'Signup request rejected',
            'reason': reason
        })

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'DEV_ADMIN':
            return ApprovalRequest.objects.all()
        elif user.role == 'COMPANY_ADMIN':
            return ApprovalRequest.objects.filter(company_id=user.company_id)
        else:
            # Employees see their own requests
            return ApprovalRequest.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        instance = serializer.save()
        
        # Notify admins
        from django.db.models import Q
        admins = User.objects.filter(
            Q(role='COMPANY_ADMIN', company_id=instance.company_id) | 
            Q(role='DEV_ADMIN')
        )
        
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title='New Approval Request',
                message=f"{instance.requested_by.username} requested to {instance.action.lower()} {instance.entity_type} #{instance.entity_id}",
                type='Info',
                action_url='/app/approval-requests'
            )

    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        user = request.user
        if user.role == 'DEV_ADMIN':
            count = ApprovalRequest.objects.filter(status='PENDING').count()
        elif user.role == 'COMPANY_ADMIN':
            count = ApprovalRequest.objects.filter(company_id=user.company_id, status='PENDING').count()
        else:
            count = ApprovalRequest.objects.filter(requested_by=user, status='PENDING').count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval = self.get_object()
        
        # Verify permission
        if request.user.role not in ['DEV_ADMIN', 'COMPANY_ADMIN']:
            return Response({'error': 'Permission denied'}, status=403)
            
        approval.status = 'APPROVED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.review_note = request.data.get('review_note', '')
        approval.save()
        
        # Perform the actual action
        try:
            if approval.action == 'DELETE':
                if approval.entity_type == 'enquiry':
                    Enquiry.objects.get(id=approval.entity_id).delete()
                elif approval.entity_type == 'registration':
                    Registration.objects.get(id=approval.entity_id).delete()
                elif approval.entity_type == 'enrollment':
                    Enrollment.objects.get(id=approval.entity_id).delete()
                # Add other entities as needed
                
            elif approval.action == 'UPDATE':
                # Apply pending changes to the entity
                print(f"DEBUG: Applying UPDATE for {approval.entity_type} #{approval.entity_id}")
                print(f"DEBUG: Pending changes: {approval.pending_changes}")
                
                if not approval.pending_changes:
                    print("DEBUG: No pending_changes found!")
                    return Response({'error': 'No pending changes to apply'}, status=400)
                
                # Helper function to convert camelCase to snake_case
                def camel_to_snake(name):
                    import re
                    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
                    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
                
                entity = None
                if approval.entity_type == 'enquiry':
                    entity = Enquiry.objects.get(id=approval.entity_id)
                elif approval.entity_type == 'registration':
                    entity = Registration.objects.get(id=approval.entity_id)
                elif approval.entity_type == 'enrollment':
                    entity = Enrollment.objects.get(id=approval.entity_id)
                
                if entity:
                    print(f"DEBUG: Found entity, applying {len(approval.pending_changes)} changes")
                    # Apply each field change
                    for field, value in approval.pending_changes.items():
                        # Convert camelCase to snake_case
                        snake_field = camel_to_snake(field)
                        
                        if hasattr(entity, snake_field):
                            old_value = getattr(entity, snake_field)
                            setattr(entity, snake_field, value)
                            print(f"DEBUG: Updated {snake_field}: {old_value} -> {value}")
                        else:
                            print(f"DEBUG: Field {field} (as {snake_field}) not found on entity")
                    entity.save()
                    print("DEBUG: Entity saved successfully")
                else:
                    print("DEBUG: Entity not found!")
                    return Response({'error': 'Invalid entity type'}, status=400)
                
        except Exception as e:
            return Response({'error': str(e)}, status=400)
        
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval = self.get_object()
        
        # Verify permission
        if request.user.role not in ['DEV_ADMIN', 'COMPANY_ADMIN']:
            return Response({'error': 'Permission denied'}, status=403)
            
        approval.status = 'REJECTED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.review_note = request.data.get('review_note', '')
        approval.save()
        
        return Response({'status': 'rejected'})

class StudentDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing physical documents taken from students
    """
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = StudentDocument.objects.all()
        
        # Filter by company
        if user.role != 'DEV_ADMIN':
            queryset = queryset.filter(company_id=user.company_id)
        
        # Filter by registration if provided
        registration_id = self.request.query_params.get('registration', None)
        if registration_id:
            queryset = queryset.filter(registration_id=registration_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-received_at')
    
    @action(detail=False, methods=['post'])
    def return_docs(self, request):
        """
        Mark multiple documents as returned
        Expects: { "document_ids": [1, 2, 3] }
        """
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response({'error': 'No documents specified'}, status=400)
        
        # Update documents
        docs = StudentDocument.objects.filter(
            id__in=document_ids,
            company_id=request.user.company_id,
            status='Held'
        )
        
        count = docs.count()
        docs.update(status='Returned', returned_at=timezone.now())
        
        return Response({
            'status': 'success',
            'returned_count': count,
            'message': f'{count} document(s) marked as returned'
        })
