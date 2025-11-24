from core.models import User, Payment, Registration, Enrollment

email = 'ihtdimapur@gmail.com'
user = User.objects.filter(email=email).first()

if user:
    print(f"User Found: {user.username}")
    print(f"Role: {user.role}")
    print(f"Company ID: '{user.company_id}'")
    
    # Check if there are payments for this company
    pays = Payment.objects.filter(company_id=user.company_id).count()
    print(f"Payments for this company: {pays}")
    
    # Check total payments
    total_pays = Payment.objects.count()
    print(f"Total Payments in DB: {total_pays}")
    
    # Check payments with OTHER company IDs
    other_pays = Payment.objects.exclude(company_id=user.company_id)
    for p in other_pays:
        print(f"Other Payment: {p.amount}, Company ID: '{p.company_id}'")

else:
    print(f"User with email {email} not found!")
