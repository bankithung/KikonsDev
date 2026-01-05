#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate

# Create DEV_ADMIN account (main system administrator)
# This is idempotent - won't recreate if already exists
python manage.py create_dev_admin
