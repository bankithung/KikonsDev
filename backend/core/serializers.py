from rest_framework import serializers
from .models import (
    User, Enquiry, Registration, Enrollment, Payment, Document,
    DocumentTransfer, Task, Appointment, University, Template,
    Notification, Commission, Refund, LeadSource, VisaTracking, FollowUp,
    Installment, Agent, ChatConversation, ChatMessage, GroupChat, SignupRequest,
    ApprovalRequest
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'company_id', 'avatar', 'password']
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

class RegistrationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'

    class Meta:
        model = Registration
        fields = '__all__'

class EnrollmentSerializer(serializers.ModelSerializer):
    # Map frontend fields to backend fields
    studentId = serializers.PrimaryKeyRelatedField(source='student', queryset=Registration.objects.all(), write_only=True)
    programName = serializers.CharField(source='program_name', write_only=True)
    programDuration = serializers.IntegerField(source='duration_months', write_only=True)
    startDate = serializers.DateField(source='start_date', write_only=True)
    serviceCharge = serializers.DecimalField(source='commission_amount', max_digits=10, decimal_places=2, write_only=True, required=False)
    
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'
    
    # Extra fields for fee calculation
    schoolFees = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, default=0)
    hostelFees = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, default=0)
    
    # Payment fields (write_only)
    paymentType = serializers.ChoiceField(choices=['Full', 'Installment'], write_only=True, required=False, default='Full')
    installmentsCount = serializers.IntegerField(write_only=True, required=False, min_value=1)
    installmentAmount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    
    # Read-only fields
    enrollmentNo = serializers.CharField(source='enrollment_no', read_only=True)
    studentName = serializers.CharField(source='student.student_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'enrollmentNo', 'studentId', 'student', 'studentName', 'programName', 
            'programDuration', 'startDate', 'serviceCharge', 'schoolFees', 
            'hostelFees', 'total_fees', 'status', 'company_id',
            'university', 'country', 'paymentType', 'installmentsCount', 'installmentAmount',
            'created_by_name'
        ]
        extra_kwargs = {
            'total_fees': {'read_only': True},
            'enrollment_no': {'read_only': True},
            'student': {'read_only': True}
        }

    def create(self, validated_data):
        # Extract extra fields
        school_fees = validated_data.pop('schoolFees', 0)
        hostel_fees = validated_data.pop('hostelFees', 0)
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

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

class DocumentTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTransfer
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

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

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'

    class Meta:
        model = FollowUp
        fields = '__all__'

class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = '__all__'

class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
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

