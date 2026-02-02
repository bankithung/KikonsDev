
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()
username = 'admin'
email = 'admin@example.com'
password = 'adminpassword'
role = 'DEV_ADMIN'
company_id = 'COMP001'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password, role=role, company_id=company_id)
    print(f"Superuser '{username}' created with password '{password}'")
else:
    print(f"Superuser '{username}' already exists")
