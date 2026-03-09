@echo off
cd C:\Users\STEVE\Documents\projets\yoonu-dal-project
call venv\Scripts\activate
python manage.py reset_monthly_limits >> logs\monthly_reset.log 2>&1