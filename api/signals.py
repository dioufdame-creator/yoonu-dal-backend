# api/signals.py
# REMPLACER COMPLÈTEMENT

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.test.client import RequestFactory
from rest_framework.test import force_authenticate
from .models import Expense, ScoreHistory
from decimal import Decimal


@receiver(post_save, sender=Expense)
def update_score_on_expense(sender, instance, created, **kwargs):
    """Mettre à jour le score automatiquement après chaque dépense"""
    if created:
        user = instance.user
        today = timezone.now().date()

        existing = ScoreHistory.objects.filter(
            user=user,
            snapshot_date=today
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
            snapshot.budget_score = score_data.get('budget_score', 0)
            snapshot.savings_score = score_data.get('savings_score', 0)
            snapshot.discipline_score = score_data.get('discipline_score', 0)
            snapshot.monthly_income = monthly_income
            snapshot.total_expenses = total_expenses
            snapshot.savings_rate = savings_rate
            snapshot.save()

            print(f"✅ Snapshot mis à jour: {score_data.get('total_score')}\n")
        else:
            print(f"⚠️ ERREUR UPDATE - Status {response.status_code}\n")

    except Exception as e:
        print(f"❌ EXCEPTION UPDATE pour {user.username}: {e}")
        import traceback
        traceback.print_exc()
        print()