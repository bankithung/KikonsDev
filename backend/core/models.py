from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('DEV_ADMIN', 'Dev Admin'),
        ('COMPANY_ADMIN', 'Company Admin'),
        ('MANAGER', 'Manager'),
        ('EMPLOYEE', 'Employee'),
        ('HR', 'HR'),
        ('SALES', 'Sales & Marketing'),
        ('ACCOUNTS', 'Accounts / Finance'),
        ('COUNSELOR', 'Counselor'),
        ('OPERATIONS', 'Operations'),
        ('IT_SUPPORT', 'IT Support'),
        ('TEAM_LEADER', 'Team Leader'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE')
    company_id = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    
    # Personal Details
    gender = models.CharField(max_length=10, choices=(('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')), blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    parents_name = models.CharField(max_length=255, blank=True, null=True)
    religion = models.CharField(max_length=50, blank=True, null=True)
    state_from = models.CharField(max_length=100, blank=True, null=True)

    # Employment Details
    date_of_joining = models.DateField(blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Assignments
    assigned_state = models.CharField(max_length=100, blank=True, null=True)
    assigned_district = models.CharField(max_length=100, blank=True, null=True)
    assigned_location = models.CharField(max_length=255, blank=True, null=True)

class Enquiry(models.Model):
    STATUS_CHOICES = (('New', 'New'), ('Converted', 'Converted'), ('Closed', 'Closed'))
    
    date = models.DateTimeField(auto_now_add=True)
    school_name = models.CharField(max_length=255)
    stream = models.CharField(max_length=50)
    candidate_name = models.CharField(max_length=255, blank=True, default='')
    course_interested = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20)
    email = models.EmailField()
    father_name = models.CharField(max_length=255)
    mother_name = models.CharField(max_length=255)
    father_occupation = models.CharField(max_length=255, blank=True, default='')
    mother_occupation = models.CharField(max_length=255, blank=True, default='')
    father_mobile = models.CharField(max_length=20, blank=True, default='')
    mother_mobile = models.CharField(max_length=20, blank=True, default='')
    permanent_address = models.TextField()
    
    # Personal Details
    caste = models.CharField(max_length=50, blank=True, default='')
    religion = models.CharField(max_length=50, blank=True, default='')
    
    # Academic Fields
    class12_passing_year = models.CharField(max_length=10, blank=True, default='')
    pcb_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pcm_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    physics_marks = models.IntegerField(null=True, blank=True)
    maths_marks = models.IntegerField(null=True, blank=True)
    chemistry_marks = models.IntegerField(null=True, blank=True)
    biology_marks = models.IntegerField(null=True, blank=True)
    previous_neet_marks = models.IntegerField(null=True, blank=True)
    present_neet_marks = models.IntegerField(null=True, blank=True)
    gap_year = models.BooleanField(default=False)
    college_dropout = models.BooleanField(default=False)
    
    # Other optional fields
    other_location = models.CharField(max_length=255, blank=True, default='')
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # New Fields
    class_10_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    class_10_school_name = models.CharField(max_length=255, blank=True, default='')
    class_10_board = models.CharField(max_length=100, blank=True, default='')
    class_10_passing_year = models.CharField(max_length=10, blank=True, default='')
    class_10_place = models.CharField(max_length=100, blank=True, default='')
    class_10_state = models.CharField(max_length=100, blank=True, default='')
    
    class_12_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    school_board = models.CharField(max_length=100, blank=True, default='')
    school_place = models.CharField(max_length=100, blank=True, default='')
    school_state = models.CharField(max_length=100, blank=True, default='')
    family_place = models.CharField(max_length=100, blank=True, default='')
    family_state = models.CharField(max_length=100, blank=True, default='')
    gender = models.CharField(max_length=20, choices=(('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')), blank=True, default='')
    dob = models.DateField(null=True, blank=True)
    gap_year_from = models.IntegerField(null=True, blank=True)
    gap_year_to = models.IntegerField(null=True, blank=True)
    
    preferred_locations = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    company_id = models.CharField(max_length=100, default='')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_enquiries')

class Registration(models.Model):
    registration_no = models.CharField(max_length=50, unique=True)
    student_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20)
    email = models.EmailField()
    gender = models.CharField(max_length=20, choices=(('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')), blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    father_name = models.CharField(max_length=255, blank=True, default='')
    mother_name = models.CharField(max_length=255, blank=True, default='')
    permanent_address = models.TextField(blank=True, default='')
    registration_date = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Personal Details
    caste = models.CharField(max_length=50, blank=True, default='')
    religion = models.CharField(max_length=50, blank=True, default='')
    
    # Parent additional details
    father_occupation = models.CharField(max_length=255, blank=True, default='')
    mother_occupation = models.CharField(max_length=255, blank=True, default='')
    father_mobile = models.CharField(max_length=20, blank=True, default='')
    mother_mobile = models.CharField(max_length=20, blank=True, default='')
    family_place = models.CharField(max_length=100, blank=True, default='')
    family_state = models.CharField(max_length=100, blank=True, default='')

    # Academic Fields
    class10_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    class10_school_name = models.CharField(max_length=255, blank=True, default='')
    class10_board = models.CharField(max_length=100, blank=True, default='')
    class10_passing_year = models.CharField(max_length=10, blank=True, default='')
    class10_place = models.CharField(max_length=100, blank=True, default='')
    class10_state = models.CharField(max_length=100, blank=True, default='')
    
    class12_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    school_board = models.CharField(max_length=100, blank=True, default='')
    school_place = models.CharField(max_length=100, blank=True, default='')
    school_state = models.CharField(max_length=100, blank=True, default='')
    class12_passing_year = models.CharField(max_length=10, blank=True, default='')
    school_name = models.CharField(max_length=255, blank=True, default='')
    
    # Marks
    pcb_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pcm_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    physics_marks = models.IntegerField(null=True, blank=True)
    maths_marks = models.IntegerField(null=True, blank=True)
    chemistry_marks = models.IntegerField(null=True, blank=True)
    biology_marks = models.IntegerField(null=True, blank=True)
    previous_neet_marks = models.IntegerField(null=True, blank=True)
    present_neet_marks = models.IntegerField(null=True, blank=True)

    # Gap Year
    gap_year = models.BooleanField(default=False)
    gap_year_from = models.IntegerField(null=True, blank=True)
    gap_year_to = models.IntegerField(null=True, blank=True)
    college_dropout = models.BooleanField(default=False)
    needs_loan = models.BooleanField(default=False)
    payment_status = models.CharField(max_length=20, default='Pending')
    payment_method = models.CharField(max_length=50, default='Cash')
    registration_fee = models.DecimalField(max_digits=10, decimal_places=2)
    preferences = models.JSONField(default=list)
    company_id = models.CharField(max_length=100, default='')
    enquiry = models.ForeignKey(Enquiry, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_registrations')

class Enrollment(models.Model):
    enrollment_no = models.CharField(max_length=50, unique=True)
    student = models.ForeignKey(Registration, on_delete=models.CASCADE)
    program_name = models.CharField(max_length=255)
    university = models.CharField(max_length=255, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    start_date = models.DateField()
    duration_months = models.IntegerField()
    total_fees = models.DecimalField(max_digits=10, decimal_places=2)
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Renaming or mapping commission_amount
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    school_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hostel_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default='Active')
    company_id = models.CharField(max_length=100, default='')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_enrollments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Installment(models.Model):
    enrollment = models.ForeignKey(Enrollment, related_name='installments', on_delete=models.CASCADE)
    number = models.IntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending')

class Payment(models.Model):
    student_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='Success')
    method = models.CharField(max_length=50)
    metadata = models.JSONField(default=dict, blank=True)
    company_id = models.CharField(max_length=100, default='')

class Refund(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    refund_date = models.DateTimeField(auto_now_add=True)
    refund_method = models.CharField(max_length=50, default='')
    reason = models.TextField()
    status = models.CharField(max_length=20, default='Pending', choices=(
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Completed', 'Completed'),
        ('Rejected', 'Rejected')
    ))
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_refunds')
    processed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    student_name = models.CharField(max_length=255, default='')
    company_id = models.CharField(max_length=100, default='')
    
    def __str__(self):
        return f"Refund ₹{self.amount} for {self.student_name} - {self.status}"

class Document(models.Model):
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    description = models.CharField(max_length=255, blank=True, default='')
    type = models.CharField(max_length=50)
    status = models.CharField(max_length=10, choices=(('IN', 'IN'), ('OUT', 'OUT')), default='IN')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, related_name='uploaded_documents', on_delete=models.SET_NULL, null=True, blank=True)
    current_holder = models.ForeignKey(User, related_name='held_documents', on_delete=models.SET_NULL, null=True, blank=True)
    student_name = models.CharField(max_length=255, blank=True)
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    expiry_date = models.DateField(blank=True, null=True)
    company_id = models.CharField(max_length=100, default='')

class StudentDocument(models.Model):
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='student_documents')
    name = models.CharField(max_length=255) # PAN, Aadhaar, etc.
    document_number = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, default='Held', choices=(('Held', 'Held'), ('Returned', 'Returned')))
    received_at = models.DateTimeField(auto_now_add=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, default='')
    company_id = models.CharField(max_length=100, default='')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_documents')
    current_holder = models.ForeignKey(User, related_name='held_physical_documents', on_delete=models.SET_NULL, null=True, blank=True)

class StudentRemark(models.Model):
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='remarks')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_remarks')
    remark = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    company_id = models.CharField(max_length=100, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Remark for {self.registration.student_name} by {self.user.username if self.user else 'Unknown'}"

class DocumentTransfer(models.Model):
    sender = models.ForeignKey(User, related_name='sent_transfers', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_transfers', on_delete=models.CASCADE)
    documents = models.ManyToManyField(Document)
    status = models.CharField(max_length=20, default='Pending', choices=(
        ('Pending', 'Pending'), ('Accepted', 'Accepted'), ('Rejected', 'Rejected'), ('Cancelled', 'Cancelled')
    ))
    message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    company_id = models.CharField(max_length=100, default='')

class PhysicalDocumentTransfer(models.Model):
    sender = models.ForeignKey(User, related_name='sent_physical_transfers', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_physical_transfers', on_delete=models.CASCADE)
    documents = models.ManyToManyField(StudentDocument)
    status = models.CharField(max_length=20, default='Pending', choices=(
        ('Pending', 'Pending'), 
        ('Accepted', 'Accepted'), 
        ('Rejected', 'Rejected'), 
        ('Cancelled', 'Cancelled'),
        ('Dispatched', 'Dispatched'),
        ('In Transit', 'In Transit'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Delivered', 'Delivered'),
        ('Returned', 'Returned'),
        ('Held', 'Held')
    ))
    message = models.TextField(blank=True, default='')
    tracking_number = models.CharField(max_length=100, blank=True, default='')
    courier_name = models.CharField(max_length=100, blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    company_id = models.CharField(max_length=100, default='')

class TransferTimeline(models.Model):
    transfer = models.ForeignKey(PhysicalDocumentTransfer, on_delete=models.CASCADE, related_name='timeline')
    status = models.CharField(max_length=50)
    location = models.CharField(max_length=255, blank=True, default='')
    note = models.TextField(blank=True, default='')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    company_id = models.CharField(max_length=100, default='')

    class Meta:
        ordering = ['-created_at']

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    due_date = models.DateTimeField()
    priority = models.CharField(max_length=20, default='Medium')
    status = models.CharField(max_length=20, default='Todo')
    company_id = models.CharField(max_length=100, default='')
    position = models.IntegerField(default=0)

    class Meta:
        ordering = ['position', 'due_date']

class Appointment(models.Model):
    student_name = models.CharField(max_length=255)
    student_email = models.EmailField(blank=True)
    counselor = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField()
    time = models.TimeField(null=True, blank=True)
    duration = models.IntegerField(default=60)
    type = models.CharField(max_length=20, choices=(
        ('In-Person', 'In-Person'),
        ('Video Call', 'Video Call'),
        ('Phone Call', 'Phone Call')
    ), default='In-Person')
    status = models.CharField(max_length=20, default='Scheduled', choices=(
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled')
    ))
    notes = models.TextField(blank=True)
    company_id = models.CharField(max_length=100, default='')

class University(models.Model):
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100, default='')
    ranking = models.IntegerField(default=0)
    programs = models.JSONField(default=list)
    tuition_fee_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tuition_fee_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    admission_deadline = models.CharField(max_length=100, blank=True, default='')
    requirements = models.JSONField(default=list)
    rating = models.FloatField(default=0.0)
    company_id = models.CharField(max_length=100, default='', blank=True)

class Template(models.Model):
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=50, blank=True, default='')
    category = models.CharField(max_length=20, choices=(
        ('Email', 'Email'), ('SMS', 'SMS'), ('WhatsApp', 'WhatsApp')
    ))
    subject = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    variables = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    company_id = models.CharField(max_length=100, default='')

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.CharField(max_length=255)
    type = models.CharField(max_length=20, default='Info', choices=(
        ('Info', 'Info'), ('Success', 'Success'), ('Warning', 'Warning'), ('Error', 'Error')
    ))
    read = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    action_url = models.CharField(max_length=255, blank=True)
    company_id = models.CharField(max_length=100, default='')

class Commission(models.Model):
    agent = models.ForeignKey('Agent', on_delete=models.CASCADE, related_name='commissions', null=True, blank=True)
    agent_name = models.CharField(max_length=255)
    student_name = models.CharField(max_length=255, blank=True)
    enrollment_no = models.CharField(max_length=50, blank=True)
    enrollment_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending', choices=(
        ('Pending', 'Pending'), ('Paid', 'Paid')
    ))
    student = models.ForeignKey(Registration, on_delete=models.SET_NULL, null=True)
    enrollment_date = models.DateTimeField(auto_now_add=True)
    company_id = models.CharField(max_length=100, default='')

class LeadSource(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50, choices=(
        ('Organic', 'Organic'),
        ('Referral', 'Referral'),
        ('Advertisement', 'Advertisement'),
        ('Social Media', 'Social Media'),
        ('Other', 'Other')
    ))
    total_leads = models.IntegerField(default=0)
    conversion_rate = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, default='Active', choices=(
        ('Active', 'Active'), ('Inactive', 'Inactive')
    ))
    company_id = models.CharField(max_length=100, default='')

class VisaTracking(models.Model):
    student_name = models.CharField(max_length=255)
    student = models.ForeignKey(Registration, on_delete=models.CASCADE, null=True, blank=True)
    passport_no = models.CharField(max_length=50)
    country = models.CharField(max_length=100)
    visa_type = models.CharField(max_length=100, default='Student Visa')
    applied_date = models.DateTimeField(auto_now_add=True)
    current_stage = models.CharField(max_length=100, choices=(
        ('Document Preparation', 'Document Preparation'),
        ('Application Submitted', 'Application Submitted'),
        ('Interview Scheduled', 'Interview Scheduled'),
        ('Under Review', 'Under Review'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected')
    ), default='Document Preparation')
    interview_date = models.DateTimeField(null=True, blank=True)
    expected_decision = models.CharField(max_length=100, blank=True)
    officer = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    stage = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, default='In Progress')
    company_id= models.CharField(max_length=100, default='')

class FollowUp(models.Model):
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE)
    scheduled_for = models.DateTimeField()
    type = models.CharField(max_length=50, choices=(
        ('Call', 'Call'), ('Email', 'Email'), ('SMS', 'SMS'), ('WhatsApp', 'WhatsApp')
    ))
    status = models.CharField(max_length=20, default='Pending', choices=(
        ('Pending', 'Pending'), ('Completed', 'Completed'), ('Missed', 'Missed')
    ))
    priority = models.CharField(max_length=20, default='Medium', choices=(
        ('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')
    ))
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_followups')
    company_id = models.CharField(max_length=100, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_followups')
    
    # Enhanced Completion Fields
    outcome_status = models.CharField(max_length=50, blank=True, null=True, choices=(
        ('Positive', 'Positive - Admission Taken'),
        ('High Interest', 'High Interest'),
        ('Neutral', 'Neutral'),
        ('Low Interest', 'Low Interest'),
        ('Negative', 'Negative - Not Interested'),
        ('Follow Up Later', 'Follow Up Later')
    ))
    admission_possibility = models.IntegerField(default=0, help_text="Percentage 0-100")

    @property
    def student_name(self):
        return self.enquiry.candidate_name if self.enquiry else '-'

class FollowUpComment(models.Model):
    followup = models.ForeignKey(FollowUp, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    comment = models.TextField()
    is_completion_comment = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    company_id = models.CharField(max_length=100, default='')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username if self.user else 'Unknown'} on {self.followup.id}"

class ChatConversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    company_id = models.CharField(max_length=100, default='')

class ChatMessage(models.Model):
    conversation = models.ForeignKey(ChatConversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    company_id = models.CharField(max_length=100, default='')

class GroupChat(models.Model):
    conversation = models.OneToOneField(ChatConversation, on_delete=models.CASCADE, related_name='group_info')
    group_name = models.CharField(max_length=255)
    group_avatar = models.URLField(blank=True, null=True)
    admins = models.ManyToManyField(User, related_name='admin_groups')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    company_id = models.CharField(max_length=100, default='')

class Agent(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    commission_type = models.CharField(max_length=20, choices=(
        ('Percentage', 'Percentage'), ('Flat', 'Flat')
    ))
    commission_value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Active', choices=(
        ('Active', 'Active'), ('Inactive', 'Inactive')
    ))
    total_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    students_referred = models.IntegerField(default=0)
    company_id = models.CharField(max_length=100, default='')

class SignupRequest(models.Model):
    company_name = models.CharField(max_length=255)
    admin_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    plan = models.CharField(max_length=50, default='Starter')
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Pending', choices=(
        ('Pending', 'Pending'), 
        ('Approved', 'Approved'), 
        ('Rejected', 'Rejected')
    ))
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_signups')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    company_id = models.CharField(max_length=100, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.company_id and self.company_name:
            self.company_id = self.company_name.lower().replace(' ', '_').replace('-', '_')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.company_name} - {self.email} ({self.status})"

class ApprovalRequest(models.Model):
    """Tracks delete/edit requests from employees requiring admin approval"""
    ACTION_CHOICES = [
        ('DELETE', 'Delete'),
        ('UPDATE', 'Update'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField()
    entity_name = models.CharField(max_length=255)
    message = models.TextField()
    
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approval_requests')
    company_id = models.CharField(max_length=100)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests')
    review_note = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    pending_changes = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} {self.entity_type} #{self.entity_id} by {self.requested_by.username}"

class Company(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    website = models.URLField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    currency = models.CharField(max_length=10, default='INR (₹)')
    timezone = models.CharField(max_length=50, default='Asia/Kolkata (GMT+5:30)')
    company_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ActivityLog(models.Model):
    ACTION_TYPES = (
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create_enquiry', 'Create Enquiry'),
        ('update_enquiry', 'Update Enquiry'),
        ('create_registration', 'Create Registration'),
        ('update_registration', 'Update Registration'),
        ('create_follow_up', 'Create Follow-up'),
        ('complete_follow_up', 'Complete Follow-up'),
        ('create_task', 'Create Task'),
        ('complete_task', 'Complete Task'),
        ('add_payment', 'Add Payment'),
        ('other', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    task = models.ForeignKey('Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    company_id = models.CharField(max_length=100, default='')
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['company_id', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.action_type} at {self.timestamp}"

class Earning(models.Model):
    SOURCE_TYPES = (
        ('registration', 'Registration'),
        ('payment', 'Payment'),
        ('referral', 'Referral'),
        ('bonus', 'Bonus'),
        ('other', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earnings')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPES)
    source_id = models.CharField(max_length=100, blank=True)  # ID of the source record
    description = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    company_id = models.CharField(max_length=100, default='')
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['company_id', '-date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} from {self.source_type}"
