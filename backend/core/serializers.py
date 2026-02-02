from rest_framework import serializers
from .models import (
    User, Enquiry, Registration, Enrollment, Payment, Document, 
    StudentDocument, DocumentTransfer, Task, Appointment, University, Template,
    Notification, Commission, Refund, LeadSource, VisaTracking, FollowUp, FollowUpComment,
    Installment, Agent, ChatConversation, ChatMessage, GroupChat, SignupRequest,
    ApprovalRequest, Company, ActivityLog, Earning, PhysicalDocumentTransfer, TransferTimeline,
    StudentRemark
)

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 'company_id', 'avatar', 'password', 'is_active',
            'gender', 'phone_number', 'dob', 'parents_name', 'religion', 'state_from',
            'date_of_joining', 'salary', 'assigned_state', 'assigned_district', 'assigned_location'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'company_id': {'read_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Generate random password if not provided
            import secrets
            user.set_password(secrets.token_urlsafe(16))
        user.save()
        return user

class EnquirySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'

    class Meta:
        model = Enquiry
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    current_holder_name = serializers.SerializerMethodField()

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.username if obj.uploaded_by else '-'

    def get_current_holder_name(self, obj):
        return obj.current_holder.username if obj.current_holder else '-'

    class Meta:
        model = Document
        fields = ['id', 'file_name', 'file', 'description', 'type', 'status', 'uploaded_at', 'student_name', 'registration', 'expiry_date', 'company_id', 'uploaded_by', 'current_holder', 'uploaded_by_name', 'current_holder_name']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('student_name') and instance.registration:
            ret['student_name'] = instance.registration.student_name
        return ret

class StudentDocumentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    current_holder_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentDocument
        fields = '__all__'

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else ''
    
    def get_current_holder_name(self, obj):
        return obj.current_holder.username if obj.current_holder else ''

class StudentRemarkSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentRemark
        fields = ['id', 'registration', 'user', 'user_name', 'remark', 'created_at', 'company_id']
        read_only_fields = ['user', 'created_at', 'company_id']

    def get_user_name(self, obj):
        return obj.user.username if obj.user else 'Unknown'


class RegistrationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'

    documents = DocumentSerializer(many=True, read_only=True)
    student_documents = StudentDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Registration
        fields = '__all__'

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = '__all__'

class EnrollmentSerializer(serializers.ModelSerializer):
    # Map frontend fields to backend fields
    studentId = serializers.PrimaryKeyRelatedField(source='student', queryset=Registration.objects.all())
    programName = serializers.CharField(source='program_name')
    programDuration = serializers.IntegerField(source='duration_months')
    startDate = serializers.DateField(source='start_date')
    serviceCharge = serializers.DecimalField(source='commission_amount', max_digits=10, decimal_places=2, required=False)
    
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'
    
    # Extra fields for fee calculation
    schoolFees = serializers.DecimalField(source='school_fees', max_digits=10, decimal_places=2, required=False)
    hostelFees = serializers.DecimalField(source='hostel_fees', max_digits=10, decimal_places=2, required=False)
    
    # Payment fields (write_only for input)
    paymentType = serializers.ChoiceField(choices=['Full', 'Installment'], write_only=True, required=False, default='Full')
    installmentsCount = serializers.IntegerField(write_only=True, required=False, min_value=1)
    installmentAmount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    
    # Read-only fields
    enrollmentNo = serializers.CharField(source='enrollment_no', read_only=True)
    studentName = serializers.CharField(source='student.student_name', read_only=True)
    studentGender = serializers.CharField(source='student.gender', read_only=True)
    studentFamilyState = serializers.CharField(source='student.family_state', read_only=True)
    studentSchoolState = serializers.CharField(source='student.school_state', read_only=True)
    studentSchoolBoard = serializers.CharField(source='student.school_board', read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'enrollmentNo', 'studentId', 'student', 'studentName', 'programName', 
            'programDuration', 'startDate', 'serviceCharge', 'schoolFees', 
            'hostelFees', 'total_fees', 'status', 'company_id',
            'university', 'country', 'paymentType', 'installmentsCount', 'installmentAmount',
            'created_by_name', 'installments', 'studentGender', 'studentFamilyState', 'studentSchoolState', 'studentSchoolBoard'
        ]
        extra_kwargs = {
            'total_fees': {'read_only': True},
            'enrollment_no': {'read_only': True},
            'student': {'read_only': True}
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Determine payment type based on installments existence
        ret['paymentType'] = 'Installment' if instance.installments.exists() else 'Full'
        return ret

    def update(self, instance, validated_data):
        # Update standard fields
        # student_name is read-only from relation, cannot be updated here
        instance.program_name = validated_data.get('program_name', instance.program_name)
        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.duration_months = validated_data.get('duration_months', instance.duration_months)
        instance.university = validated_data.get('university', instance.university)
        instance.status = validated_data.get('status', instance.status)
        
        # Update Fees
        instance.commission_amount = validated_data.get('commission_amount', instance.commission_amount)
        instance.school_fees = validated_data.get('school_fees', instance.school_fees)
        instance.hostel_fees = validated_data.get('hostel_fees', instance.hostel_fees)
        
        # Recalculate Total Fees
        instance.total_fees = instance.commission_amount + instance.school_fees + instance.hostel_fees
        
        instance.save()
        
        # Note: We are currently NOT regenerating installments on update to avoid data loss on paid installments.
        # This can be added later if needed.
        
        return instance

    def create(self, validated_data):
        # Extract extra fields
        school_fees = validated_data.get('school_fees', 0)
        hostel_fees = validated_data.get('hostel_fees', 0)
        commission_amount = validated_data.get('commission_amount', 0)
        
        payment_type = validated_data.pop('paymentType', 'Full')
        installments_count = validated_data.pop('installmentsCount', 0)
        installment_amount = validated_data.pop('installmentAmount', 0)
        
        # Calculate total fees
        total_fees = school_fees + hostel_fees + commission_amount
        validated_data['total_fees'] = total_fees
        
        # Generate Enrollment No
        import uuid
        validated_data['enrollment_no'] = f"ENR-{uuid.uuid4().hex[:8].upper()}"
        
        enrollment = super().create(validated_data)
        
        # Create Installments if applicable
        if payment_type == 'Installment' and installments_count and installments_count > 0:
            from datetime import date, timedelta
            from .models import Installment
            
            amount_per_installment = installment_amount or (total_fees / installments_count)
            start_date = validated_data.get('start_date', date.today())
            
            for i in range(installments_count):
                due_date = start_date + timedelta(days=30 * (i + 1))
                Installment.objects.create(
                    enrollment=enrollment,
                    number=i + 1,
                    due_date=due_date,
                    amount=amount_per_installment,
                    status='Pending'
                )
                
        return enrollment

class PaymentSerializer(serializers.ModelSerializer):
    refunds = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = '__all__'
        
    def get_refunds(self, obj):
        refunds = obj.refunds.all()
        return RefundSerializer(refunds, many=True).data if refunds.exists() else []

class RefundSerializer(serializers.ModelSerializer):
    payment_details = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = Refund
        fields = '__all__'
        extra_kwargs = {
            'company_id': {'read_only': True}
        }
    
    def get_payment_details(self, obj):
        return {
            'amount': obj.payment.amount,
            'date': obj.payment.date,
            'method': obj.payment.method,
            'student_name': obj.payment.student_name
        }

    def validate(self, data):
        payment = data.get('payment')
        if payment and Refund.objects.filter(payment=payment).exclude(status='Rejected').exists():
            raise serializers.ValidationError("A refund request already exists for this payment.")
        return data

class DocumentTransferSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    documents_details = DocumentSerializer(source='documents', many=True, read_only=True)

    class Meta:
        model = DocumentTransfer
        fields = '__all__'

class TransferTimelineSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = TransferTimeline
        fields = '__all__'


class PhysicalDocumentTransferSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    documents_details = StudentDocumentSerializer(source='documents', many=True, read_only=True)
    timeline = TransferTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = PhysicalDocumentTransfer
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    comments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        extra_kwargs = {
            'company_id': {'read_only': True},
            'assigned_to_name': {'read_only': True}
        }

class AppointmentSerializer(serializers.ModelSerializer):
    counselor_name = serializers.SerializerMethodField()

    def get_counselor_name(self, obj):
        return obj.counselor.username if obj.counselor else '-'

    class Meta:
        model = Appointment
        fields = '__all__'

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'action_type', 'description', 'metadata', 
                  'ip_address', 'timestamp', 'company_id']
        read_only_fields = ('user', 'company_id', 'timestamp')

class EarningSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Earning
        fields = ['id', 'user', 'user_name', 'amount', 'source_type', 'source_id', 
                  'description', 'date', 'company_id']
        read_only_fields = ('user', 'company_id', 'date')

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = '__all__'

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class FollowUpSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    assigned_to_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    assigned_to_name = serializers.SerializerMethodField()
    assigned_to_email = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    student_phone = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else '-'
    
    def get_assigned_to_email(self, obj):
        return obj.assigned_to.email if obj.assigned_to else '-'
    
    def get_student_name(self, obj):
        return obj.enquiry.candidate_name if obj.enquiry else '-'
    
    def get_student_email(self, obj):
        return obj.enquiry.email if obj.enquiry else '-'
        
    def get_student_phone(self, obj):
        return obj.enquiry.mobile if obj.enquiry else '-'
    
    def get_comments(self, obj):
        # Only include comments in detail view
        if self.context.get('include_comments', False):
            from .models import FollowUpComment
            comments = obj.comments.all()
            return FollowUpCommentSerializer(comments, many=True).data
        return []

    class Meta:
        model = FollowUp
        fields = '__all__'
        read_only_fields = ('created_by',)

class FollowUpCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    def get_user_name(self, obj):
        return obj.user.username if obj.user else 'Unknown'
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else ''
    
    class Meta:
        model = FollowUpComment
        fields = ['id', 'followup', 'user', 'user_name', 'user_email', 'comment', 
                  'is_completion_comment', 'created_at', 'updated_at', 'company_id', 'parent_comment']
        read_only_fields = ('user', 'company_id', 'is_completion_comment', 'user_name', 'user_email')

class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = '__all__'


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = '__all__'

class VisaTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisaTracking
        fields = '__all__'

# New Serializers for Chat System
class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.URLField(source='sender.avatar', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = '__all__'

class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()
    
    def get_participant_count(self, obj):
        return obj.participants.count()
    
    class Meta:
        model = ChatConversation
        fields = '__all__'

class GroupChatSerializer(serializers.ModelSerializer):
    conversation = ChatConversationSerializer(read_only=True)
    admin_count = serializers.SerializerMethodField()
    
    def get_admin_count(self, obj):
        return obj.admins.count()
    
    class Meta:
        model = GroupChat
        fields = '__all__'



# Agent & SignupRequest Serializers
class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = '__all__'

class SignupRequestSerializer(serializers.ModelSerializer):
    # Read-only fields for audit trail
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = SignupRequest
        fields = [
            'id', 'company_name', 'admin_name', 'email', 'phone', 'plan',
            'username', 'password', 'first_name', 'last_name',
            'requested_at', 'status', 'approved_by', 'approved_by_name', 
            'approved_at', 'rejection_reason', 'company_id'
        ]
        extra_kwargs = {
            'password': {'write_only': True},  # Never return password
            'approved_by': {'read_only': True},
            'approved_at': {'read_only': True},
            'company_id': {'read_only': True}
        }
    
    def create(self, validated_data):
        # Hash the password before saving
        from django.contrib.auth.hashers import make_password
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = ApprovalRequest
        fields = '__all__'
        read_only_fields = ['status', 'requested_at', 'reviewed_at', 'reviewed_by', 'company_id', 'requested_by']
        
    def create(self, validated_data):
        # Assign current user as requested_by
        user = self.context['request'].user
        validated_data['requested_by'] = user
        validated_data['company_id'] = user.company_id
        return super().create(validated_data)


