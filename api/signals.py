# api/signals.py
# REMPLACER COMPLÈTEMENT

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.test.client import RequestFactory
from rest_framework.test import force_authenticate
from .models import Expense, ScoreHistory
from django.db.models import Sum  # ✅ Ajouter après ligne 9
from decimal import Decimal
from django.db.models.signals import post_save, post_delete  # ✅ Ajouter post_delete


@receiver(post_save, sender=Expense)
def update_score_on_expense(sender, instance, created, **kwargs):
    """Mettre à jour le score automatiquement après chaque dépense"""
    if created:
        user = instance.user
        today = timezone.now().date()

        existing = ScoreHistory.objects.filter(
            user=user,
            month=current_month
        ).first()

        if existing:
            update_score_snapshot(existing, user)
        else:
            create_score_snapshot(user)


def create_score_snapshot(user):
    """Créer un nouveau snapshot du score"""
    try:
        print(f"\n🔍 DEBUG: Calcul score pour {user.username}")

        from . import views

        factory = RequestFactory()
        request = factory.get('/api/yoonu-score/')
        force_authenticate(request, user=user)

        print(f"🔍 Appel get_yoonu_score...")
        response = views.get_yoonu_score(request)

        print(f"🔍 Status: {response.status_code}")

        if hasattr(response, 'data'):
            print(f"🔍 Response data: {response.data}")

        if hasattr(response, 'data') and response.status_code == 200:
            score_data = response.data

            expenses = Expense.objects.filter(user=user)
            total_expenses = sum(exp.amount for exp in expenses)
            monthly_income = user.profile.monthly_income or Decimal('0')

            print(f"💰 Revenus: {monthly_income}, Dépenses: {total_expenses}")

            savings = monthly_income - total_expenses
            savings_rate = (savings / monthly_income * 100) if monthly_income > 0 else 0

            ScoreHistory.objects.create(
                user=user,
                month=current_month,  # AJOUTER
                total_score=score_data.get('total_score', 0),
                budget_score=score_data.get('budget_score', 0),
                savings_score=score_data.get('savings_score', 0),
                discipline_score=score_data.get('discipline_score', 0),
                monthly_income=monthly_income,
                total_expenses=total_expenses,
                savings_rate=savings_rate
            )

            print(f"✅ Score snapshot créé pour {user.username}: {score_data.get('total_score')}\n")
        else:
            # Status 500 ou autre erreur
            print(f"⚠️ ERREUR - Status {response.status_code}")

            if hasattr(response, 'data'):
                print(f"⚠️ Erreur détails: {response.data}")

            # Créer quand même un snapshot par défaut
            expenses = Expense.objects.filter(user=user)
            total_expenses = sum(exp.amount for exp in expenses)
            monthly_income = user.profile.monthly_income or Decimal('0')

            ScoreHistory.objects.create(
                user=user,
                month=current_month,  # AJOUTER
                total_score=0,
                budget_score=0,
                savings_score=0,
                discipline_score=0,
                monthly_income=monthly_income,
                total_expenses=total_expenses,
                savings_rate=0
            )
            print(f"⚠️ Snapshot par défaut créé (score=0)\n")

    except Exception as e:
        print(f"❌ EXCEPTION pour {user.username}: {e}")
        import traceback
        traceback.print_exc()
        print()


def update_score_snapshot(snapshot, user):
    """Mettre à jour un snapshot existant"""
    try:
        print(f"\n🔄 UPDATE: Score pour {user.username}")

        from . import views

        factory = RequestFactory()
        request = factory.get('/api/yoonu-score/')
        force_authenticate(request, user=user)

        response = views.get_yoonu_score(request)

        if hasattr(response, 'data') and response.status_code == 200:
            score_data = response.data

            expenses = Expense.objects.filter(user=user)
            total_expenses = sum(exp.amount for exp in expenses)
            monthly_income = user.profile.monthly_income or Decimal('0')

            savings = monthly_income - total_expenses
            savings_rate = (savings / monthly_income * 100) if monthly_income > 0 else 0

            snapshot.total_score = score_data.get('total_score', 0)
            snapshot.alignment_score = Decimal(str(score_data.get('alignment_score', 0)))
            snapshot.discipline_score = Decimal(str(score_data.get('discipline_score', 0)))
            snapshot.stability_score = Decimal(str(score_data.get('stability_score', 0)))
            snapshot.improvement_score = Decimal(str(score_data.get('improvement_score', 0)))
            snapshot.save()

            print(f"✅ Snapshot mis à jour: {score_data.get('total_score')}\n")
        else:
            print(f"⚠️ ERREUR UPDATE - Status {response.status_code}\n")

    except Exception as e:
        print(f"❌ EXCEPTION UPDATE pour {user.username}: {e}")
        import traceback
        traceback.print_exc()
        print()
# ==========================================
# SIGNALS POUR MISE À JOUR AUTOMATIQUE DES ENVELOPPES
# ==========================================

from django.db.models.signals import post_delete
from django.db.models import Sum
from .models import Envelope


def get_categories_for_envelope(envelope_type):
    """Retourne les catégories de dépenses associées à une enveloppe"""
    mapping = {
        'essentiels': ['logement', 'alimentation', 'transport', 'santé'],
        'plaisirs': ['loisirs', 'vêtements', 'autre'],
        'projets': ['éducation', 'famille', 'spiritualité'],
        'liberation': ['dettes'],
    }
    return mapping.get(envelope_type, [])


def update_all_envelopes(user):
    """
    Met à jour current_spent de toutes les enveloppes pour un utilisateur
    Appelé automatiquement quand une dépense est créée/modifiée/supprimée
    """
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    for envelope_type in ['essentiels', 'plaisirs', 'projets', 'liberation']:
        categories = get_categories_for_envelope(envelope_type)
        
        # Calculer le total des dépenses du mois pour ces catégories
        month_expenses = Expense.objects.filter(
            user=user,
            category__in=categories,
            date__gte=current_month
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Mettre à jour ou créer l'enveloppe
        try:
            envelope = Envelope.objects.get(user=user, envelope_type=envelope_type)
            envelope.current_spent = month_expenses
            envelope.save(update_fields=['current_spent'])
        except Envelope.DoesNotExist:
            # Créer l'enveloppe si elle n'existe pas
            default_percentages = {
                'essentiels': 50,
                'plaisirs': 30,
                'projets': 15,
                'liberation': 5
            }
            monthly_income = user.profile.monthly_income or Decimal('0')
            percentage = default_percentages[envelope_type]
            
            Envelope.objects.create(
                user=user,
                envelope_type=envelope_type,
                allocated_percentage=percentage,
                monthly_budget=(Decimal(percentage) / 100) * monthly_income,
                current_spent=month_expenses
            )


@receiver(post_save, sender=Expense)
def update_envelopes_on_expense_save(sender, instance, created, **kwargs):
    """
    Signal : Met à jour les enveloppes quand une dépense est créée ou modifiée
    """
    update_all_envelopes(instance.user)


@receiver(post_delete, sender=Expense)
def update_envelopes_on_expense_delete(sender, instance, **kwargs):
    """
    Signal : Met à jour les enveloppes quand une dépense est supprimée
    """
    update_all_envelopes(instance.user)
