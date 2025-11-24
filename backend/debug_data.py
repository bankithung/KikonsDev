from core.models import Registration, Enrollment, Payment, User
from django.utils import timezone
from django.db.models import Sum

print("--- DEBUG DATA ---")

# Check Users
print(f"\nTotal Users: {User.objects.count()}")
for u in User.objects.all()[:5]:
    print(f"User: {u.username}, Role: {u.role}, Company ID: '{u.company_id}'")

# Check Registrations
print(f"\nTotal Registrations: {Registration.objects.count()}")
for r in Registration.objects.all()[:5]:
    print(f"Reg: {r.student_name}, Date: {r.registration_date}, Company ID: '{r.company_id}'")

# Check Enrollments
print(f"\nTotal Enrollments: {Enrollment.objects.count()}")
for e in Enrollment.objects.all()[:5]:
    print(f"Enr: {e.program_name}, Start Date: {e.start_date}, Commission: {e.commission_amount}, Company ID: '{e.company_id}'")

# Check Payments
print(f"\nTotal Payments: {Payment.objects.count()}")
for p in Payment.objects.all()[:5]:
    print(f"Pay: {p.amount}, Date: {p.date}, Status: '{p.status}', Type: '{p.type}', Company ID: '{p.company_id}'")

print("\n--- END DEBUG ---")
