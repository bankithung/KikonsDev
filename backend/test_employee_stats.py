from django.contrib.auth import get_user_model
from core.models import Enquiry, Registration, Task, FollowUp, Earning

User = get_user_model()

# Get the user
user = User.objects.get(username='ihtdimapur')

print(f"=== Employee Stats for {user.username} (ID: {user.id}) ===")
print(f"Company ID: {user.company_id}")
print()

# Enquiries
enquiries = Enquiry.objects.filter(created_by=user)
print(f"Total Enquiries Created: {enquiries.count()}")
if enquiries.exists():
    for enq in enquiries[:3]:
        print(f"  - {enq.candidate_name} ({enq.status})")
print()

# Registrations  
registrations = Registration.objects.filter(created_by=user)
print(f"Total Registrations Created: {registrations.count()}")
if registrations.exists():
    for reg in registrations[:3]:
        print(f"  - {reg.student_name} ({reg.registration_no})")
print()

# Follow-ups
followups_active = FollowUp.objects.filter(assigned_to=user, status='Pending')
followups_done = FollowUp.objects.filter(assigned_to=user, status='Completed')
print(f"Active Follow-ups: {followups_active.count()}")
print(f"Completed Follow-ups: {followups_done.count()}")
print()

# Tasks
tasks_active = Task.objects.filter(assigned_to=user, status__in=['Todo', 'In Progress'])
tasks_done = Task.objects.filter(assigned_to=user, status='Done')
print(f"Active Tasks: {tasks_active.count()}")
print(f"Completed Tasks: {tasks_done.count()}")
print()

# Earnings
from django.db.models import Sum
earnings = Earning.objects.filter(user=user)
total = earnings.aggregate(total=Sum('amount'))['total'] or 0
print(f"Total Earnings: ₹{total}")
print(f"Number of earning records: {earnings.count()}")
