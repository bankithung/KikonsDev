import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Task, Earning, ActivityLog, FollowUp

def populate():
    try:
        user = User.objects.get(pk=5)
        print(f"Populating data for: {user.username}")
        
        # 1. Create Tasks
        if Task.objects.filter(assigned_to=user).count() == 0:
            Task.objects.create(
                title="Follow up with excessive leads",
                description="Call leads from last week who didn't respond",
                assigned_to=user,
                due_date=timezone.now() + timedelta(days=2),
                priority="High",
                status="Todo",
                company_id=user.company_id
            )
            Task.objects.create(
                title="Prepare monthly report",
                description="Compile conversion stats",
                assigned_to=user,
                due_date=timezone.now() + timedelta(days=5),
                priority="Medium",
                status="In Progress",
                company_id=user.company_id
            )
            print("Created 2 Tasks")
        else:
            print("Tasks already exist")

        # 2. Create Earnings
        if Earning.objects.filter(user=user).count() == 0:
            Earning.objects.create(
                user=user,
                amount=5000.00,
                source_type="Commission",
                description="Commission for Student A",
                date=timezone.now().date(),
                company_id=user.company_id
            )
            Earning.objects.create(
                user=user,
                amount=2500.00,
                source_type="Bonus",
                description="Performance Bonus",
                date=timezone.now().date() - timedelta(days=10),
                company_id=user.company_id
            )
            print("Created 2 Earnings")
        else:
            print("Earnings already exist")

        # 3. Create Activity Logs
        if ActivityLog.objects.filter(user=user).count() == 0:
            ActivityLog.objects.create(
                user=user,
                action_type="LOGIN",
                description="User logged in",
                timestamp=timezone.now() - timedelta(hours=2),
                company_id=user.company_id
            )
            ActivityLog.objects.create(
                user=user,
                action_type="UPDATE",
                description="Updated student profile",
                timestamp=timezone.now() - timedelta(minutes=45),
                company_id=user.company_id
            )
            print("Created 2 Activity Logs")
        else:
            print("Activity Logs already exist")

    except User.DoesNotExist:
        print("User 5 not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    populate()
