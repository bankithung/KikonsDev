from core.models import Registration, Enrollment, Payment
from django.utils import timezone
import datetime

print("--- BACKFILLING PAYMENTS ---")

# Backfill Registrations
registrations = Registration.objects.all()
reg_count = 0
for r in registrations:
    # Check if payment already exists (simple check)
    exists = Payment.objects.filter(
        student_name=r.student_name,
        type='Registration',
        amount=r.registration_fee
    ).exists()
    
    if not exists:
        p = Payment.objects.create(
            student_name=r.student_name,
            amount=r.registration_fee,
            type='Registration',
            status='Success',
            method='Cash', # Default
            company_id=r.company_id
        )
        # Update date to match registration date
        p.date = r.registration_date
        p.save()
        reg_count += 1
        print(f"Created Payment for Registration: {r.student_name}")

print(f"Backfilled {reg_count} registration payments.")

# Backfill Enrollments
enrollments = Enrollment.objects.all()
enr_count = 0
for e in enrollments:
    # Check if payment already exists
    exists = Payment.objects.filter(
        student_name=e.student.student_name,
        type='Enrollment',
        amount=e.total_fees
    ).exists()
    
    if not exists:
        # Convert date to datetime
        dt = datetime.datetime.combine(e.start_date, datetime.datetime.min.time())
        dt = timezone.make_aware(dt)
        
        p = Payment.objects.create(
            student_name=e.student.student_name,
            amount=e.total_fees,
            type='Enrollment',
            status='Success',
            method='Cash', # Default
            company_id=e.company_id
        )
        # Update date to match start date
        p.date = dt
        p.save()
        enr_count += 1
        print(f"Created Payment for Enrollment: {e.student.student_name}")

print(f"Backfilled {enr_count} enrollment payments.")
print("--- DONE ---")
