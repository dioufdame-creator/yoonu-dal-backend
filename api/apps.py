from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):  # ✅ 4 espaces d'indentation
        import api.signals  # ✅ 8 espaces
