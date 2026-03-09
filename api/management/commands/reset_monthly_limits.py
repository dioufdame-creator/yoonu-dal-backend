# api/management/commands/reset_monthly_limits.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta


class Command(BaseCommand):
    help = 'Reset les limites mensuelles et vérifie les expirations'

    def handle(self, *args, **options):
        today = timezone.now().date()
        self.stdout.write(f'\n🔄 Reset mensuel - {today}\n')
        self.stdout.write('=' * 50)
        
        # 1. Reset compteurs AI messages
        reset_count = self.reset_ai_messages()
        
        # 2. Vérifier expirations trials
        expired_trials = self.check_trial_expirations()
        
        # 3. Vérifier expirations Premium
        expired_premium = self.check_premium_expirations()
        
        # Résumé
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS(f'\n✅ Reset terminé !'))
        self.stdout.write(f'   - {reset_count} compteurs AI reset')
        self.stdout.write(f'   - {expired_trials} trials expirés')
        self.stdout.write(f'   - {expired_premium} abonnements Premium expirés\n')

    def reset_ai_messages(self):
        """Reset les compteurs de messages IA pour les utilisateurs Freemium"""
        today = timezone.now().date()
        count = 0
        
        self.stdout.write('\n📊 Reset compteurs messages IA...')
        
        for user in User.objects.all():
            try:
                profile = user.profile
                
                # Vérifier si le reset est nécessaire
                if profile.ai_messages_reset_date < today:
                    # Reset le compteur
                    old_count = profile.ai_messages_count
                    profile.ai_messages_count = 0
                    
                    # Calculer prochaine date de reset (1er du mois prochain)
                    next_reset = (today.replace(day=1) + relativedelta(months=1))
                    profile.ai_messages_reset_date = next_reset
                    
                    profile.save()
                    count += 1
                    
                    self.stdout.write(
                        f'   ✓ {user.username}: {old_count} → 0 (prochain reset: {next_reset})'
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'   ⚠ Erreur {user.username}: {e}')
                )
        
        return count

    def check_trial_expirations(self):
        """Vérifier et désactiver les trials expirés"""
        now = timezone.now()
        count = 0
        
        self.stdout.write('\n🎁 Vérification expirations trials...')
        
        for user in User.objects.all():
            try:
                profile = user.profile
                
                # Si trial actif et expiré
                if profile.trial_active and profile.trial_expires_at:
                    if profile.trial_expires_at < now:
                        profile.trial_active = False
                        profile.save()
                        count += 1
                        
                        self.stdout.write(
                            self.style.WARNING(
                                f'   ⏰ {user.username}: Trial expiré (était jusqu\'au {profile.trial_expires_at.date()})'
                            )
                        )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'   ⚠ Erreur {user.username}: {e}')
                )
        
        if count == 0:
            self.stdout.write('   ✓ Aucun trial expiré')
        
        return count

    def check_premium_expirations(self):
        """Vérifier et désactiver les abonnements Premium expirés"""
        now = timezone.now()
        count = 0
        
        self.stdout.write('\n💎 Vérification expirations Premium...')
        
        for user in User.objects.all():
            try:
                profile = user.profile
                
                # Si Premium et expiré
                if profile.subscription_tier == 'premium' and profile.subscription_expires_at:
                    if profile.subscription_expires_at < now:
                        profile.subscription_tier = 'free'
                        profile.subscription_expires_at = None
                        profile.save()
                        count += 1
                        
                        self.stdout.write(
                            self.style.WARNING(
                                f'   ⏰ {user.username}: Premium expiré (était jusqu\'au {profile.subscription_expires_at.date()})'
                            )
                        )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'   ⚠ Erreur {user.username}: {e}')
                )
        
        if count == 0:
            self.stdout.write('   ✓ Aucun abonnement Premium expiré')
        
        return count
