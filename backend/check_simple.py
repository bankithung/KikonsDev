from core.models import User, Payment

try:
    u = User.objects.get(email='ihtdimapur@gmail.com')
    print(f"TARGET_USER: {u.username}")
    print(f"TARGET_COMPANY_ID: '{u.company_id}'")
    
    count = Payment.objects.filter(company_id=u.company_id).count()
    print(f"MATCHING_PAYMENTS: {count}")
    
    all_pays = Payment.objects.all()
    print(f"TOTAL_PAYMENTS: {all_pays.count()}")
    
    for p in all_pays:
        print(f"PAYMENT_ID: {p.id}, AMOUNT: {p.amount}, COMPANY_ID: '{p.company_id}'")
        
except User.DoesNotExist:
    print("User not found")
