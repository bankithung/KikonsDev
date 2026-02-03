"""
Secure Superuser Creation Script
Run with: python manage.py shell < create_secure_superuser.py

This script creates a DEV_ADMIN superuser with strong password validation.
"""
import os
import sys
import re
import secrets
import string

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


def generate_strong_password(length=16):
    """Generate a cryptographically secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Ensure password meets requirements
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password


def validate_password_strength(password):
    """Validate password meets security requirements."""
    errors = []
    
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long")
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return errors


def create_superuser():
    """Create a secure superuser."""
    print("\n" + "=" * 60)
    print("SECURE SUPERUSER CREATION")
    print("=" * 60)
    
    # Check if admin already exists
    if User.objects.filter(username='admin').exists():
        print("\n[!] User 'admin' already exists.")
        response = input("Do you want to reset the password? (yes/no): ").strip().lower()
        if response != 'yes':
            print("Aborting.")
            return
        user = User.objects.get(username='admin')
    else:
        user = None
    
    # Get username
    if not user:
        username = input("\nEnter username (default: admin): ").strip() or 'admin'
    else:
        username = 'admin'
    
    # Get email
    email = input("Enter email (default: admin@example.com): ").strip() or 'admin@example.com'
    
    # Password options
    print("\nPassword Options:")
    print("1. Enter your own password (must meet security requirements)")
    print("2. Generate a secure random password")
    choice = input("Choose (1 or 2): ").strip()
    
    if choice == '2':
        password = generate_strong_password()
        print(f"\n[+] Generated Password: {password}")
        print("[!] SAVE THIS PASSWORD SECURELY! It will not be shown again.")
    else:
        while True:
            password = input("\nEnter password (min 12 chars, mixed case, number, symbol): ").strip()
            errors = validate_password_strength(password)
            if errors:
                print("\n[!] Password does not meet requirements:")
                for error in errors:
                    print(f"    - {error}")
            else:
                confirm = input("Confirm password: ").strip()
                if password != confirm:
                    print("[!] Passwords do not match. Try again.")
                else:
                    break
    
    # Create or update user
    try:
        if user:
            user.set_password(password)
            user.save()
            print(f"\n[+] Password updated for user '{username}'")
        else:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                role='DEV_ADMIN'
            )
            print(f"\n[+] Superuser '{username}' created successfully!")
        
        # Set additional security attributes
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if hasattr(user, 'role'):
            user.role = 'DEV_ADMIN'
        user.save()
        
        print("\n" + "=" * 60)
        print("SUPERUSER DETAILS")
        print("=" * 60)
        print(f"Username: {username}")
        print(f"Email:    {email}")
        print(f"Role:     DEV_ADMIN")
        print(f"Password: {'*' * len(password)} (saved securely)")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[!] Error creating superuser: {e}")
        return


if __name__ == '__main__':
    create_superuser()
