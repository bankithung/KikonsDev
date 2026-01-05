from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Enquiry, Registration, Enrollment, Installment, 
    Payment, Document, DocumentTransfer, Task, Appointment,
    University, Template, Notification, LeadSource, Refund,
    DeveloperSignupRequest, Company
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'company_id', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'company_id')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'company_id', 'avatar')}),
    )


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'created_at')
    search_fields = ('name', 'email')


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'school_name', 'mobile', 'status', 'date', 'company_id')
    list_filter = ('status', 'company_id')
    search_fields = ('student_name', 'school_name', 'mobile')
    date_hierarchy = 'date'


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('registration_no', 'student_name', 'mobile', 'email', 'company_id')
    search_fields = ('registration_no', 'student_name', 'mobile', 'email')
    list_filter = ('company_id',)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('enrollment_no', 'student', 'program_name', 'status', 'company_id')
    list_filter = ('status', 'company_id')
    search_fields = ('enrollment_no', 'program_name')


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'number', 'due_date', 'amount', 'status')
    list_filter = ('status',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'amount', 'date', 'type', 'status', 'method')
    list_filter = ('status', 'type', 'method')
    search_fields = ('student_name',)
    date_hierarchy = 'date'


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'document_type', 'status', 'registration', 'company_id')
    list_filter = ('document_type', 'status', 'company_id')
    search_fields = ('file_name',)


@admin.register(DocumentTransfer)
class DocumentTransferAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'assigned_to', 'due_date', 'priority', 'status')
    list_filter = ('priority', 'status', 'company_id')
    search_fields = ('title',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'counselor', 'date', 'status', 'company_id')
    list_filter = ('status', 'company_id')
    search_fields = ('student_name',)


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'city', 'ranking', 'rating')
    list_filter = ('country',)
    search_fields = ('name', 'country', 'city')


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'template_type', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('title',)


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'source_type', 'is_active', 'company_id')
    list_filter = ('source_type', 'is_active')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'amount', 'status', 'refund_date')
    list_filter = ('status',)
    search_fields = ('student_name',)


@admin.register(DeveloperSignupRequest)
class DeveloperSignupRequestAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'email', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('company_name', 'email')
