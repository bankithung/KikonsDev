import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = "admin"
email = "admin@example.com"
password = "adminpassword123"
role = "DEV_ADMIN"

if not User.objects.filter(username=username).exists():
    print(f"Creating superuser {username}...")
    user = User.objects.create_superuser(username=username, email=email, password=password)
    user.role = role
    user.save()
    print(f"Superuser created successfully.")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print(f"Role: {role}")
else:
    print(f"User {username} already exists.")
    user = User.objects.get(username=username)
    if not user.is_superuser:
        user.is_superuser = True
        user.save()
        print("Updated to superuser.")
    if user.role != role:
        user.role = role
        user.save()
        print(f"Updated role to {role}.")
