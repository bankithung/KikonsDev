from rest_framework import serializers
from .models import (
    User, Enquiry, Registration, Enrollment, Payment, Document, 
    StudentDocument, DocumentTransfer, Task, Appointment, University, Template,
    Notification, Commission, Refund, LeadSource, VisaTracking, FollowUp,
    Installment, Agent, ChatConversation, ChatMessage, GroupChat, SignupRequest,
    ApprovalRequest, Company
)

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

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
    
    class Meta:
        model = StudentDocument
        fields = '__all__'

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else ''


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
    schoolFees = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, default=0)
    hostelFees = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, default=0)
    
    # Payment fields (write_only for input)
    paymentType = serializers.ChoiceField(choices=['Full', 'Installment'], write_only=True, required=False, default='Full')
    installmentsCount = serializers.IntegerField(write_only=True, required=False, min_value=1)
    installmentAmount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    
    # Read-only fields
    enrollmentNo = serializers.CharField(source='enrollment_no', read_only=True)
    studentName = serializers.CharField(source='student.student_name', read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'enrollmentNo', 'studentId', 'student', 'studentName', 'programName', 
            'programDuration', 'startDate', 'serviceCharge', 'schoolFees', 
            'hostelFees', 'total_fees', 'status', 'company_id',
            'university', 'country', 'paymentType', 'installmentsCount', 'installmentAmount',
            'created_by_name', 'installments'
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

class PaymentSerializer(serializers.ModelSerializer):
    # TODO: Re-enable after Refund migration is applied
    # refunds = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = '__all__'
    
    # def get_refunds(self, obj):
    #     refunds = obj.refunds.all()
    #     return RefundSerializer(refunds, many=True).data if refunds.exists() else []

class RefundSerializer(serializers.ModelSerializer):
    payment_details = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = Refund
        fields = '__all__'
    
    def get_payment_details(self, obj):
        return {
            'amount': obj.payment.amount,
            'date': obj.payment.date,
            'method': obj.payment.method,
            'student_name': obj.payment.student_name
        }

class DocumentTransferSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    documents_details = DocumentSerializer(source='documents', many=True, read_only=True)

    class Meta:
        model = DocumentTransfer
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        extra_kwargs = {
            'company_id': {'read_only': True},
            'assigned_to_name': {'read_only': True}
        }

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


