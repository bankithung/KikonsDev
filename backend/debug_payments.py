from core.models import Payment, User
from django.utils import timezone
from django.db.models import Sum

print("--- DEBUG PAYMENTS ---")

# Get the user (assuming the one logged in is the first company admin or similar)
user = User.objects.filter(role='COMPANY_ADMIN').first()
if not user:
    user = User.objects.filter(role='DEV_ADMIN').first()
    
print(f"Checking for User: {user.username}, Role: {user.role}, Company ID: '{user.company_id}'")

# Check Payments for this company
payments = Payment.objects.filter(company_id=user.company_id)
print(f"Total Payments for Company '{user.company_id}': {payments.count()}")

current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
print(f"Current Month Start: {current_month_start}")

current_month_payments = payments.filter(date__gte=current_month_start)
print(f"Current Month Payments: {current_month_payments.count()}")

for p in current_month_payments:
    print(f"Pay: {p.amount}, Date: {p.date}, Status: '{p.status}', Type: '{p.type}'")

# Check if there are payments with DIFFERENT company_id
other_payments = Payment.objects.exclude(company_id=user.company_id)
print(f"\nPayments with OTHER Company IDs: {other_payments.count()}")
for p in other_payments[:5]:
    print(f"Pay: {p.amount}, Company ID: '{p.company_id}'")

print("--- END DEBUG ---")
