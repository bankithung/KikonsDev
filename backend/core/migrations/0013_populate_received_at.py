# Generated manually

from django.db import migrations
from django.utils import timezone


def update_received_dates(apps, schema_editor):
    """Set received_at to current time for all documents that don't have it set"""
    StudentDocument = apps.get_model('core', 'StudentDocument')
    StudentDocument.objects.filter(received_at__isnull=True).update(received_at=timezone.now())


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_studentdocument'),  # Update this to your latest migration
    ]

    operations = [
        migrations.RunPython(update_received_dates, reverse_code=migrations.RunPython.noop),
    ]
