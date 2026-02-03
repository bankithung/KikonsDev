"""
Secure DEV_ADMIN Creation Script
================================
Creates the root administrator account with secure credentials.

Usage:
    python create_super_admin.py

Environment Variables (Optional - set these for automation):
    ADMIN_USERNAME  - Admin username (default: admin)
    ADMIN_EMAIL     - Admin email (default: admin@kikons.com)
    ADMIN_PASSWORD  - Admin password (auto-generated if not set)
"""
import os
import sys
import secrets
import string
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()


def generate_secure_password(length=16):
    """Generate a cryptographically secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Ensure password meets all requirements
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password


def create_dev_admin():
    """Create or update the DEV_ADMIN superuser."""
    
    # Get credentials from environment or use secure defaults
    username = os.getenv('ADMIN_USERNAME', 'admin')
    email = os.getenv('ADMIN_EMAIL', 'admin@kikons.com')
    password = os.getenv('ADMIN_PASSWORD')
    
    # Generate secure password if not provided
    password_was_generated = False
    if not password:
        password = generate_secure_password()
        password_was_generated = True
    
    role = "DEV_ADMIN"
    company_id = "owner"
    
    print("\n" + "=" * 60)
    print("DEV_ADMIN ACCOUNT SETUP")
    print("=" * 60)
    
    if not User.objects.filter(username=username).exists():
        print(f"\n[+] Creating superuser '{username}'...")
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        user.role = role
        user.company_id = company_id
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        
        print(f"[✓] Superuser created successfully!")
        
    else:
        print(f"\n[!] User '{username}' already exists. Updating...")
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.role = role
        if not user.company_id:
            user.company_id = company_id
        user.save()
        
        print(f"[✓] User updated successfully!")
    
    # Display credentials
    print("\n" + "-" * 60)
    print("ADMIN CREDENTIALS")
    print("-" * 60)
    print(f"  Username: {username}")
    print(f"  Email:    {email}")
    print(f"  Role:     {role}")
    
    if password_was_generated:
        print(f"\n  Password: {password}")
        print("\n  [!] SAVE THIS PASSWORD! It was auto-generated and")
        print("      will NOT be shown again.")
    else:
        print(f"\n  Password: (set via ADMIN_PASSWORD environment variable)")
    
    print("-" * 60)
    print("\n[✓] DEV_ADMIN setup complete!\n")


if __name__ == '__main__':
    create_dev_admin()
