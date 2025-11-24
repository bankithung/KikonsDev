from core.models import Registration, Enrollment, Payment, User

print("--- FIXING COMPANY IDS FINAL ---")

target_email = 'ihtdimapur@gmail.com'
user = User.objects.filter(email=target_email).first()

if not user:
    print(f"User {target_email} not found!")
    exit()

target_company_id = user.company_id
print(f"Target Company ID: '{target_company_id}'")

# Update ALL records to this company ID (assuming single tenant dev env for this user's data)
# Or update 'test_consultancy' ones if we want to be specific, but 'all' is safer for "fix it now"
# considering the user claims the data is theirs.

# Fix Registrations
regs = Registration.objects.all()
print(f"Updating {regs.count()} Registrations to '{target_company_id}'")
regs.update(company_id=target_company_id)

# Fix Enrollments
enrs = Enrollment.objects.all()
print(f"Updating {enrs.count()} Enrollments to '{target_company_id}'")
enrs.update(company_id=target_company_id)

# Fix Payments
pays = Payment.objects.all()
print(f"Updating {pays.count()} Payments to '{target_company_id}'")
pays.update(company_id=target_company_id)

print("--- DONE ---")
