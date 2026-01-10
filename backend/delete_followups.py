#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import FollowUp

# Delete all existing followups to allow migration
count = FollowUp.objects.all().count()
FollowUp.objects.all().delete()
print(f"Deleted {count} follow-ups to allow migration")
