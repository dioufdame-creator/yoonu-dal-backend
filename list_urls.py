import os
import sys
import django

# Configurer l'environnement Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yoonudal_backend.settings")
django.setup()

# Importer les modules nécessaires
from django.urls import get_resolver
from django.core.management import call_command

# Afficher toutes les URLs de l'application
print("Liste des URLs:")
call_command('show_urls')