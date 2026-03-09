# api/management/commands/calculate_daily_scores.py
# CRÉER CE FICHIER (même structure que reset_monthly_limits.py)

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.signals import create_score_snapshot


class Command(BaseCommand):
    help = 'Calculer et sauvegarder les scores quotidiens pour tous les utilisateurs'

    def handle(self, *args, **options):
        today = timezone.now().date()
        users = User.objects.filter(is_active=True)
        
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"📊 CALCUL DES SCORES QUOTIDIENS - {today}")
        self.stdout.write(f"{'='*60}\n")
        
        success_count = 0
        error_count = 0
        
        for user in users:
            try:
                # Vérifier si un snapshot existe déjà aujourd'hui
                from api.models import ScoreHistory
                existing = ScoreHistory.objects.filter(
                    user=user,
                    snapshot_date=today
                ).first()
                
                if not existing:
                    create_score_snapshot(user)
                    success_count += 1
                    self.stdout.write(f"✅ {user.username}: Score sauvegardé")
                else:
                    self.stdout.write(f"⏭️ {user.username}: Déjà calculé aujourd'hui")
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f"❌ {user.username}: {str(e)}"))
        
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS(f"✅ {success_count} scores calculés"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"❌ {error_count} erreurs"))
        self.stdout.write(f"{'='*60}\n")
