from rest_framework import viewsets
from .models import (
    User, Enquiry, Registration, Enrollment, Installment, Payment, Refund,
    Document, StudentDocument, DocumentTransfer, Task, Appointment, University, Template,
    Notification, Commission, LeadSource, VisaTracking, FollowUp, FollowUpComment,
    Agent, ChatConversation, ChatMessage, GroupChat, SignupRequest, ApprovalRequest, Company,
    ActivityLog, Earning, StudentRemark, PhysicalDocumentTransfer, TransferTimeline
)

from .serializers import (
    UserSerializer, CompanySerializer, EnquirySerializer, RegistrationSerializer, EnrollmentSerializer,
    InstallmentSerializer, PaymentSerializer, RefundSerializer, DocumentSerializer, StudentDocumentSerializer,
    DocumentTransferSerializer, TaskSerializer, AppointmentSerializer, UniversitySerializer,
    TemplateSerializer, NotificationSerializer, CommissionSerializer, LeadSourceSerializer,
    VisaTrackingSerializer, FollowUpSerializer, FollowUpCommentSerializer, AgentSerializer, ChatConversationSerializer,
    ChatMessageSerializer, GroupChatSerializer, SignupRequestSerializer, ApprovalRequestSerializer,
    CompanySerializer, StudentRemarkSerializer, PhysicalDocumentTransferSerializer
)

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models.functions import Concat
from django.db.models import Count, Sum, Avg, Q, F, Value
from django.db import transaction

class CompanyIsolationMixin:
    """
    Mixin to filter querysets based on the user's company_id.
    DEV_ADMIN gets full access.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user or not user.is_authenticated:
            return queryset.none()
            
        if getattr(user, 'role', None) == 'DEV_ADMIN':
            return queryset
            
        user_company_id = getattr(user, 'company_id', None)
        if not user_company_id:
            return queryset.none()
            
        model = self.serializer_class.Meta.model
        
        # Direct relationship
        # Check if the field exists on the model (using string check to avoid instance creation)
        # We can inspect the model fields.
        model_fields = [f.name for f in model._meta.get_fields()]
        
        if 'company_id' in model_fields:
            return queryset.filter(company_id=user_company_id)
            
        # Indirect relationships
        if model.__name__ == 'Installment':
            return queryset.filter(enrollment__company_id=user_company_id)
            
        return queryset

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Company.objects.none()
            
        if getattr(user, 'role', None) == 'DEV_ADMIN':
            return Company.objects.all()
            
        # Company Admin and Employees see only their company
        company_id = getattr(user, 'company_id', None)
        if company_id:
            return Company.objects.filter(company_id=company_id)
            
        return Company.objects.none()
    
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


# ... (Keeping UserViewSet and others as they are, skipping to Chat ViewSets)

# New ViewSets
class AgentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

class ChatConversationViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = ChatConversation.objects.all()
    serializer_class = ChatConversationSerializer
    
    def perform_create(self, serializer):
        serializer.save(company_id=self.request.user.company_id)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a conversation"""
        conversation = self.get_object() # This already uses CompanyIsolationMixin via get_queryset
        messages = conversation.messages.all().order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

class ChatMessageViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            company_id=self.request.user.company_id
        )

class GroupChatViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = GroupChat.objects.all()
    serializer_class = GroupChatSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user, 
            company_id=self.request.user.company_id
        )

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
    
    @action(detail=False, methods=['get'], url_path='company-users', permission_classes=[IsAuthenticated])
    def company_users(self, request):
        """Get all users in the same company as the current user"""
        company_id = request.user.company_id
        
        # Debug logging
        import sys
        print(f"DEBUG: company_users request by {request.user.username} (Role: {request.user.role}, CompanyID: '{company_id}')", file=sys.stderr)
        
        if not company_id:
            # If no company ID, safeguarded to return empty (or handle DEV_ADMIN differently if needed)
            # This prevents filter(company_id=None) matching all users with no company.
            if request.user.role == 'DEV_ADMIN':
                 # DEV_ADMIN sees users with no company (system users) or all? 
                 # Returning users with company_id=None (system users)
                 users = User.objects.filter(company_id=company_id)
            else:
                 users = User.objects.none()
        else:
            users = User.objects.filter(company_id=str(company_id))

        print(f"DEBUG: returning {users.count()} users", file=sys.stderr)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def counselors_analytics(self, request):
        """Get performance analytics for all team members"""
        # Get all users in the company
        counselors = User.objects.filter(company_id=request.user.company_id)
        analytics = []
        
        this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
        
        for counselor in counselors:
            # Stats for this specific counselor
            active_enquiries = Enquiry.objects.filter(created_by=counselor, status='New').count()
            
            month_conversions = Enquiry.objects.filter(
                created_by=counselor,
                status='Converted',
                date__gte=this_month_start
            ).count()
            
            # Calculate per-counselor conversion rate
            total_enquiries = Enquiry.objects.filter(created_by=counselor).count()
            converted = Enquiry.objects.filter(created_by=counselor, status='Converted').count()
            conversion_rate = (converted / total_enquiries * 100) if total_enquiries > 0 else 0
            
            # Calculate avg response time (time to first follow-up)
            followups = FollowUp.objects.filter(created_by=counselor).select_related('enquiry')
            avg_response_hours = 2.0
            if followups.exists():
                durations = []
                for fu in followups:
                    if fu.enquiry and fu.created_at > fu.enquiry.date:
                        diff = (fu.created_at - fu.enquiry.date).total_seconds() / 3600
                        durations.append(diff)
                if durations:
                    avg_response_hours = sum(durations) / len(durations)

            analytics.append({
                'id': counselor.id,
                'name': counselor.username,
                'email': counselor.email,
                'avatar': counselor.avatar,
                'activeEnquiries': active_enquiries,
                'thisMonthConversions': month_conversions,
                'conversionRate': round(conversion_rate, 1),
                'avgResponseTime': str(round(avg_response_hours, 1)),
                'status': 'Available' if counselor.is_active else 'Offline'
            })
        
        return Response(analytics)

    @action(detail=True, methods=['post'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        """Toggle user active status (Suspend/Activate)"""
        user_to_update = self.get_object()
        user_acting = request.user
        
        # Security: Only COMPANY_ADMIN (or DEV_ADMIN) can update status
        if user_acting.role not in ['COMPANY_ADMIN', 'DEV_ADMIN']:
             return Response({'error': 'Permission denied'}, status=403)
             
        # Prevent suspending self
        if user_to_update.id == user_acting.id:
            return Response({'error': 'Cannot suspend yourself'}, status=400)

        # Toggle is_active
        user_to_update.is_active = not user_to_update.is_active
        user_to_update.save()
        
        status_text = 'active' if user_to_update.is_active else 'suspended'
        return Response({'status': status_text, 'is_active': user_to_update.is_active})
    
    @action(detail=True, methods=['get'], url_path='stats')
    def employee_stats(self, request, pk=None):
        """Get stats for a specific employee"""
        employee = self.get_object()
        
        # Count enquiries created by this specific employee
        total_enquiries = Enquiry.objects.filter(
            created_by=employee,
            company_id=employee.company_id
        ).count()
        
        # Count registrations created by this specific employee
        total_registrations = Registration.objects.filter(
            created_by=employee,
            company_id=employee.company_id
        ).count()
        
        # Calculate total earnings for this specific employee
        from django.db.models import Sum
        total_earnings = Earning.objects.filter(
            user=employee,
            company_id=employee.company_id
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Count follow-ups assigned to this specific employee
        active_followups = FollowUp.objects.filter(
            assigned_to=employee,
            status='Pending',
            company_id=employee.company_id
        ).count()
        
        completed_followups = FollowUp.objects.filter(
            assigned_to=employee,
            status='Completed',
            company_id=employee.company_id
        ).count()
        
        # Count tasks assigned to this specific employee
        active_tasks = Task.objects.filter(
            assigned_to=employee,
            status__in=['Todo', 'In Progress'],
            company_id=employee.company_id
        ).count()
        
        completed_tasks = Task.objects.filter(
            assigned_to=employee,
            status='Done',
            company_id=employee.company_id
        ).count()
        
        return Response({
            'totalEnquiries': total_enquiries,
            'totalRegistrations': total_registrations,
            'totalEarnings': float(total_earnings),
            'activeFollowups': active_followups,
            'completedFollowups': completed_followups,
            'activeTasks': active_tasks,
            'completedTasks': completed_tasks,
        })
    
    @action(detail=True, methods=['get'], url_path='activity-logs')
    def activity_logs(self, request, pk=None):
        """Get activity logs for a specific employee"""
        employee = self.get_object()
        logs = ActivityLog.objects.filter(user=employee)
        
        # Pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(logs, request)
        
        from .serializers import ActivityLogSerializer
        serializer = ActivityLogSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='earnings')
    def employee_earnings(self, request, pk=None):
        """Get earnings for a specific employee"""
        employee = self.get_object()
        earnings = Earning.objects.filter(user=employee)
        
        from .serializers import EarningSerializer
        serializer = EarningSerializer(earnings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='entries')
    def employee_entries(self, request, pk=None):
        """Get entries (enquiries + registrations) created by employee"""
        employee = self.get_object()
        
        enquiries = Enquiry.objects.filter(created_by=employee).order_by('-date')[:50]
        registrations = Registration.objects.filter(created_by=employee).order_by('-created_at')[:50]
        
        from .serializers import EnquirySerializer, RegistrationSerializer
        enquiries_data = EnquirySerializer(enquiries, many=True).data
        registrations_data = RegistrationSerializer(registrations, many=True).data
        
        return Response({
            'enquiries': enquiries_data,
            'registrations': registrations_data
        })

class EnquiryViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
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

class RegistrationViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
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

class EnrollmentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
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

class InstallmentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer

class PaymentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def perform_create(self, serializer):
        serializer.save(company_id=self.request.user.company_id)
    
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

class RefundViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
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

    def perform_create(self, serializer):
        user = self.request.user
        print(f"DEBUG: User Role: {user.role}, Company ID: {user.company_id}")
        # Auto-approve for Admins
        if user.role in ['DEV_ADMIN', 'COMPANY_ADMIN']:
            print("DEBUG: Auto-approving refund")
            serializer.save(
                company_id=user.company_id,
                status='Approved',
                approved_by=user,
                processed_at=timezone.now()
            )
        else:
            print("DEBUG: Creating pending refund")
            serializer.save(company_id=user.company_id)
    
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

class DocumentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user, 
            current_holder=self.request.user,
            company_id=self.request.user.company_id
        )
    
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

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'Pending':
            return Response({'error': 'Can only cancel pending transfers'}, status=400)
        
        if request.user != transfer.sender:
            return Response({'error': 'Not authorized'}, status=403)

        transfer.status = 'Cancelled'
        transfer.cancelled_at = timezone.now()
        transfer.save()
        
        return Response({'status': 'cancelled'})

class PhysicalDocumentTransferViewSet(viewsets.ModelViewSet):
    queryset = PhysicalDocumentTransfer.objects.all()
    serializer_class = PhysicalDocumentTransferSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DEV_ADMIN':
            return PhysicalDocumentTransfer.objects.all().select_related('sender', 'receiver').prefetch_related('documents')
        else:
            return PhysicalDocumentTransfer.objects.filter(
                Q(sender__company_id=user.company_id) |
                Q(receiver__company_id=user.company_id)
            ).select_related('sender', 'receiver').prefetch_related('documents')

    def perform_create(self, serializer):
        instance = serializer.save(sender=self.request.user, company_id=self.request.user.company_id)
        # Notify receiver
        Notification.objects.create(
            user=instance.receiver,
            title='Physical Document Transfer',
            message=f'{self.request.user.username} is sending you physical documents. Please verify receipt.',
            type='info',
            company_id=instance.company_id
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        transfer = self.get_object()
        status = request.data.get('status')
        note = request.data.get('note', '')
        location = request.data.get('location', '')
        
        valid_statuses = dict(PhysicalDocumentTransfer._meta.get_field('status').choices).keys()
        
        if status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=400)
            
        transfer.status = status
        
        # Update tracking info if provided
        if 'tracking_number' in request.data:
            transfer.tracking_number = request.data['tracking_number']
        if 'courier_name' in request.data:
            transfer.courier_name = request.data['courier_name']
            
        transfer.save()
        
        # Create timeline entry
        TransferTimeline.objects.create(
            transfer=transfer,
            status=status,
            note=note,
            location=location,
            updated_by=request.user,
            company_id=transfer.company_id
        )
        
        # Notify relevant party
        recipient = transfer.receiver if request.user == transfer.sender else transfer.sender
        Notification.objects.create(
            user=recipient,
            title='Transfer Status Updated',
            message=f'Transfer #{transfer.id} status updated to {status}',
            type='info',
            company_id=transfer.company_id
        )
        
        return Response(PhysicalDocumentTransferSerializer(transfer).data)

    @action(detail=True, methods=['post'])
    def confirm_receipt(self, request, pk=None):
        """Receiver confirms physical receipt of documents with optional message"""
        transfer = self.get_object()
        
        # Only receiver can confirm receipt
        if request.user != transfer.receiver:
            return Response({'error': 'Only the receiver can confirm receipt'}, status=403)
        
        # Only allow confirmation for transfers that are in transit/delivery stages
        allowed_statuses = ['Pending', 'Dispatched', 'In Transit', 'Out for Delivery', 'Accepted']
        if transfer.status not in allowed_statuses:
            return Response({'error': f'Cannot confirm receipt for status: {transfer.status}'}, status=400)
        
        message = request.data.get('message', '')
        
        # Update transfer status to Delivered (confirmed)
        transfer.status = 'Delivered'
        transfer.accepted_at = timezone.now()
        transfer.save()
        
        # Update documents holder to receiver
        for doc in transfer.documents.all():
            doc.current_holder = request.user
            doc.save()
        
        # Create timeline entry
        TransferTimeline.objects.create(
            transfer=transfer,
            status='Delivered',
            note=f'Receipt confirmed by {request.user.username}. {message}'.strip(),
            location='',
            updated_by=request.user,
            company_id=transfer.company_id
        )
        
        # Notify sender
        Notification.objects.create(
            user=transfer.sender,
            title='Documents Received',
            message=f'{request.user.username} has confirmed receipt of the physical documents.' + (f' Message: {message}' if message else ''),
            type='success',
            company_id=transfer.company_id
        )
        
        return Response({
            'status': 'confirmed',
            'message': 'Receipt confirmed successfully'
        })

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
            title='Physical Transfer Accepted',
            message=f'{request.user.username} has accepted the physical documents.',
            type='success',
            company_id=transfer.company_id
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

        Notification.objects.create(
            user=transfer.sender,
            title='Physical Transfer Rejected',
            message=f'{request.user.username} rejected the physical documents.',
            type='error',
            company_id=transfer.company_id
        )
        
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'Pending':
            return Response({'error': 'Can only cancel pending transfers'}, status=400)
        
        if request.user != transfer.sender:
            return Response({'error': 'Not authorized'}, status=403)

        transfer.status = 'Cancelled'
        transfer.cancelled_at = timezone.now()
        transfer.save()
        
        return Response({'status': 'cancelled'})

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DEV_ADMIN':
            return Task.objects.all()
        
        queryset = Task.objects.filter(company_id=user.company_id)
        
        # If the user is an EMPLOYEE, they should only see tasks assigned to them
        if user.role == 'EMPLOYEE':
            queryset = queryset.filter(assigned_to=user)
            
        return queryset.annotate(comments_count=Count('activity_logs')).order_by('position', 'due_date')

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

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder tasks. 
        Expected data: { items: [{ id: 1, position: 0, status: 'Todo', reason: 'Optional reason' }, ...] }
        """
        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'No items provided'}, status=400)
            
        try:
            with transaction.atomic():
                for item in items:
                    task_id = item.get('id')
                    position = item.get('position')
                    status = item.get('status')
                    reason = item.get('reason')
                    
                    if task_id is not None:
                        # Update position and status
                        # Validate that the task belongs to the user's company
                        task = Task.objects.filter(
                            id=task_id, 
                            company_id=request.user.company_id
                        ).first()
                        
                        if task:
                            old_status = task.status
                            task.position = position
                            if status:
                                task.status = status
                            task.save()
                            
                            # Log activity if reason provided and status changed
                            if reason and status and old_status != status:
                                ActivityLog.objects.create(
                                    user=request.user,
                                    task=task,
                                    action_type='update_task',
                                    description=f'Moved task "{task.title}" from {old_status} to {status}. Reason: {reason}',
                                    company_id=request.user.company_id
                                )

            return Response({'status': 'success'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Get activity logs for a specific task.
        """
        task = self.get_object()
        logs = ActivityLog.objects.filter(task=task).order_by('-timestamp')
        
        # Serialize simply (or use a serializer if needed)
        data = [{
            'id': log.id,
            'user': f"{log.user.first_name} {log.user.last_name}".strip() or log.user.username,
            'action_type': log.action_type,
            'description': log.description,
            'timestamp': log.timestamp,
        } for log in logs]
        
        return Response(data)

class AppointmentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow all company users to see all appointments for their company
        return super().get_queryset()

    def perform_create(self, serializer):
        appointment = serializer.save(company_id=self.request.user.company_id)
        
        # Notify the counselor
        if appointment.counselor != self.request.user:
            try:
                Notification.objects.create(
                    user=appointment.counselor,
                    title='New Appointment Scheduled',
                    message=f'You have a new appointment with {appointment.student_name} on {appointment.date.date()}.',
                    type='Info',
                    action_url='/app/appointments'
                )
            except Exception as e:
                print(f"Error creating notification: {e}")

    @action(detail=False, methods=['get'])
    def calendar_view(self, request):
        """Get appointments formatted for calendar view"""
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        queryset = self.get_queryset()
        
        if month and year:
            queryset = queryset.filter(
                date__year=year,
                date__month=month
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)




class StudentRemarkViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = StudentRemark.objects.all()
    serializer_class = StudentRemarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        registration_id = self.request.query_params.get('registration_id')
        if registration_id is not None:
            if registration_id == '':
                return queryset.none()
            return queryset.filter(registration_id=registration_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            company_id=self.request.user.company_id
        )


class UniversityViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):

    queryset = University.objects.all()
    serializer_class = UniversitySerializer

class TemplateViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class CommissionViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = Commission.objects.all()
    serializer_class = CommissionSerializer


class LeadSourceViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer

class VisaTrackingViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = VisaTracking.objects.all()
    serializer_class = VisaTrackingSerializer

class FollowUpViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = FollowUp.objects.all()
    serializer_class = FollowUpSerializer

    def perform_create(self, serializer):
        # Get assigned_to_id from request data
        assigned_to_id = self.request.data.get('assigned_to_id')
        
        # If no assigned_to_id provided, assign to current user
        if not assigned_to_id:
            assigned_to_id = self.request.user.id
        
        # Save with created_by, company_id, and assigned_to
        follow_up = serializer.save(
            created_by=self.request.user,
            company_id=self.request.user.company_id,
            assigned_to_id=assigned_to_id
        )
        
        # Create notification if assigned to someone other than creator
        if assigned_to_id != self.request.user.id:
            try:
                from .models import Notification
                enquiry_name = follow_up.enquiry.candidateName if follow_up.enquiry else 'Unknown'
                Notification.objects.create(
                    user_id=assigned_to_id,
                    title='New Follow-up Assigned',
                    message=f'{self.request.user.username} assigned you a follow-up for {enquiry_name}',
                    type='followup',
                    company_id=self.request.user.company_id
                )
            except Exception as e:
                print(f"Error creating notification: {e}")
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to include comments in detail view"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'include_comments': True})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_with_comment(self, request, pk=None):
        """Complete a follow-up with a required comment"""
        followup = self.get_object()
        user = request.user
        
        # Permission check: only assigned user or admin can complete
        is_assigned = followup.assigned_to_id == user.id if followup.assigned_to else False
        is_admin = user.role in ['DEV_ADMIN', 'COMPANY_ADMIN']
        
        if not (is_assigned or is_admin):
            return Response({
                'error': 'Only the assigned user or an admin can complete this follow-up'
            }, status=403)
        
        comment_text = request.data.get('comment', '').strip()
        outcome_status = request.data.get('outcome_status')
        admission_possibility = request.data.get('admission_possibility')

        if not comment_text:
            return Response({'error': 'Comment is required to complete follow-up'}, status=400)
        
        # Create completion comment
        from .models import FollowUpComment
        FollowUpComment.objects.create(
            followup=followup,
            user=user,
            comment=comment_text,
            is_completion_comment=True,
            company_id=user.company_id
        )
        
        # Mark as completed
        followup.status = 'Completed'
        if outcome_status:
            followup.outcome_status = outcome_status
        if admission_possibility is not None:
            followup.admission_possibility = admission_possibility
            
        followup.save()
        
        # Create notification for creator if different from completer
        if followup.created_by and followup.created_by.id != user.id:
            try:
                from .models import Notification
                Notification.objects.create(
                    user_id=followup.created_by.id,
                    title='Follow-up Completed',
                    message=f'{user.username} completed the follow-up for {followup.student_name}',
                    type='followup',
                    company_id=user.company_id
                )
            except Exception as e:
                print(f"Error creating notification: {e}")
        
        return Response({'status': 'completed', 'message': 'Follow-up marked as complete'})

class FollowUpCommentViewSet(CompanyIsolationMixin, viewsets.ModelViewSet):
    queryset = FollowUpComment.objects.all()
    serializer_class = FollowUpCommentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by followup if provided
        followup_id = self.request.query_params.get('followup')
        if followup_id:
            queryset = queryset.filter(followup_id=followup_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user, company_id=self.request.user.company_id)
    
    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        # Only the comment owner can edit
        if comment.user != request.user:
            return Response({'error': 'You can only edit your own comments'}, status=403)
        return super().update(request, *args, **kwargs)
    

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        # Only the comment owner or admin can delete
        if comment.user != request.user and request.user.role not in ['DEV_ADMIN', 'COMPANY_ADMIN']:
            return Response({'error': 'You can only delete your own comments'}, status=403)
        return super().destroy(request, *args, **kwargs)

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

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        requests = ApprovalRequest.objects.filter(requested_by=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)
    
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
        
        # Filter by company (include documents with null company_id for old data)
        if user.role != 'DEV_ADMIN':
            from django.db.models import Q
            queryset = queryset.filter(Q(company_id=user.company_id) | Q(company_id__isnull=True) | Q(company_id=''))
        
        # Filter by registration if provided
        registration_id = self.request.query_params.get('registration', None)
        if registration_id:
            queryset = queryset.filter(registration_id=registration_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-received_at')
    
    def perform_create(self, serializer):
        """Automatically set company_id when creating a document"""
        serializer.save(company_id=self.request.user.company_id)
    
    @action(detail=False, methods=['post'])
    def return_docs(self, request):
        """
        Mark multiple documents as returned
        Expects: { "document_ids": [1, 2, 3] }
        """
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response({'error': 'No documents specified'}, status=400)
        
        # Update documents (include those with null company_id for old data)
        from django.db.models import Q
        docs = StudentDocument.objects.filter(
            id__in=document_ids,
            status='Held'
        ).filter(Q(company_id=request.user.company_id) | Q(company_id__isnull=True) | Q(company_id=''))
        
        count = docs.count()
        docs.update(status='Returned', returned_at=timezone.now())
        
        return Response({
            'status': 'success',
            'returned_count': count,
            'message': f'{count} document(s) marked as returned'
        })

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_date_range(self, time_range):
        today = timezone.localtime()
        end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999)

        if time_range == '7days':
            # Last 7 days including today
            start_date = today - timedelta(days=6)
            return start_date.replace(hour=0, minute=0, second=0, microsecond=0), end_of_day
        elif time_range == '30days':
             start_date = today - timedelta(days=29)
             return start_date.replace(hour=0, minute=0, second=0, microsecond=0), end_of_day
        elif time_range == 'month':
            # This month
            return today.replace(day=1, hour=0, minute=0, second=0, microsecond=0), end_of_day
        return today, end_of_day # Single day fallback

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        company_id = user.company_id
        
        # Base QuerySets (filtered by company)
        # Note: DEV_ADMIN gets all? Or just company context? The user has only 1 workspace context usually.
        # Assuming current user context.
        enquiries = Enquiry.objects.filter(company_id=company_id) if user.role != 'DEV_ADMIN' else Enquiry.objects.all()
        registrations = Registration.objects.filter(company_id=company_id) if user.role != 'DEV_ADMIN' else Registration.objects.all()
        enrollments = Enrollment.objects.filter(company_id=company_id) if user.role != 'DEV_ADMIN' else Enrollment.objects.all()
        payments = Payment.objects.filter(company_id=company_id, status='Success') if user.role != 'DEV_ADMIN' else Payment.objects.filter(status='Success')
        pending_payments = Payment.objects.filter(company_id=company_id, status='Pending') if user.role != 'DEV_ADMIN' else Payment.objects.filter(status='Pending')
        refunds = Refund.objects.filter(company_id=company_id, status='Approved') if user.role != 'DEV_ADMIN' else Refund.objects.filter(status='Approved')

        # Current Counts
        enquiries_count = enquiries.count()
        registrations_count = registrations.count()
        enrollments_count = enrollments.count()
        
        # Total Earnings Calculation
        total_payment_amount = payments.aggregate(sum=Sum('amount'))['sum'] or 0
        total_refund_amount = refunds.aggregate(sum=Sum('amount'))['sum'] or 0
        total_earnings = total_payment_amount - total_refund_amount

        # Last Month Calculations for Trends
        today = timezone.now()
        first_day_this_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = first_day_this_month - timedelta(seconds=1)
        last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Helper for % change
        def get_percentage_change(current_qs, date_field):
            this_month_count = current_qs.filter(**{f"{date_field}__gte": first_day_this_month}).count()
            last_month_count = current_qs.filter(**{f"{date_field}__gte": last_month_start, f"{date_field}__lte": last_month_end}).count()
            
            if last_month_count == 0:
                change = 100 if this_month_count > 0 else 0
            else:
                change = ((this_month_count - last_month_count) / last_month_count) * 100
            
            return round(change, 1)

        enq_trend = get_percentage_change(enquiries, 'date')
        reg_trend = get_percentage_change(registrations, 'created_at')
        enr_trend = get_percentage_change(enrollments, 'created_at') # Use created_at now
        
        # Earnings Trend
        this_month_earnings = (payments.filter(date__gte=first_day_this_month).aggregate(s=Sum('amount'))['s'] or 0) - \
                              (refunds.filter(processed_at__gte=first_day_this_month).aggregate(s=Sum('amount'))['s'] or 0)
        last_month_earnings = (payments.filter(date__gte=last_month_start, date__lte=last_month_end).aggregate(s=Sum('amount'))['s'] or 0) - \
                              (refunds.filter(processed_at__gte=last_month_start, processed_at__lte=last_month_end).aggregate(s=Sum('amount'))['s'] or 0)
                              
        if last_month_earnings == 0:
            earnings_trend = 100 if this_month_earnings > 0 else 0
        else:
            earnings_trend = ((this_month_earnings - last_month_earnings) / last_month_earnings) * 100
        
        earnings_trend = round(earnings_trend, 1)

        return Response({
            'enquiries': { 'value': enquiries_count, 'trend': enq_trend },
            'registrations': { 'value': registrations_count, 'trend': reg_trend },
            'enrollments': { 'value': enrollments_count, 'trend': enr_trend },
            'totalEarnings': { 'value': float(total_earnings), 'trend': earnings_trend },
            'pendingPayments': pending_payments.count(), # Keep for legacy support or action items
        })

    @action(detail=False, methods=['get'], url_path='chart-data')
    def chart_data(self, request):
        time_range = request.query_params.get('filter', '7days')
        start_date, end_date = self.get_date_range(time_range)
        
        user = request.user
        company_id = user.company_id
        
        # Base Q
        enquiries = Enquiry.objects.filter(company_id=company_id) if user.role != 'DEV_ADMIN' else Enquiry.objects.all()
        registrations = Registration.objects.filter(company_id=company_id) if user.role != 'DEV_ADMIN' else Registration.objects.all()
        enrollments = Enrollment.objects.filter(company_id=company_id) if user.role != 'DEV_ADMIN' else Enrollment.objects.all()

        date_list = []
        # Generate labels and buckets
        if time_range == '7days':
            # Daily buckets for 7 days
            curr = start_date
            while curr <= end_date:
                label = curr.strftime("%a") # Sun, Mon
                # Buckets
                day_start = curr
                day_end = curr.replace(hour=23, minute=59, second=59)
                
                date_list.append({
                    'name': label,
                    'enquiries': enquiries.filter(date__range=(day_start, day_end)).count(),
                    'registrations': registrations.filter(created_at__range=(day_start, day_end)).count(),
                    'enrollments': enrollments.filter(created_at__range=(day_start, day_end)).count(),
                })
                curr += timedelta(days=1)
                
        elif time_range == '30days':
             # 6 chunks of 5 days
             curr = start_date
             for i in range(6):
                 chunk_start = curr
                 # chunk covers curr + 4 days (5 days total)
                 chunk_end_date = curr + timedelta(days=4)
                 chunk_end = chunk_end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                 
                 if chunk_end > end_date: 
                     chunk_end = end_date # Clamp
                 
                 label = f"{chunk_start.day} {chunk_start.strftime('%b')}"
                 date_list.append({
                     'name': label,
                     'enquiries': enquiries.filter(date__range=(chunk_start, chunk_end)).count(),
                     'registrations': registrations.filter(created_at__range=(chunk_start, chunk_end)).count(),
                     'enrollments': enrollments.filter(created_at__range=(chunk_start, chunk_end)).count(),
                 })
                 curr += timedelta(days=5)

        elif time_range == 'month':
             # Weekly breakdown
             curr = start_date
             week_num = 1
             while curr <= end_date:
                 chunk_end_date = curr + timedelta(days=6)
                 chunk_end = chunk_end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                 
                 label = f"Week {week_num}"
                 date_list.append({
                     'name': label,
                     'enquiries': enquiries.filter(date__range=(curr, chunk_end)).count(),
                     'registrations': registrations.filter(created_at__range=(curr, chunk_end)).count(),
                     'enrollments': enrollments.filter(created_at__range=(curr, chunk_end)).count(),
                 })
                 curr += timedelta(days=7)
                 week_num += 1

        return Response(date_list)
