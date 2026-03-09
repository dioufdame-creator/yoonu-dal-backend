# api/calculate_yoonu_score.py
# Fonction de calcul du Score Yoonu Dal - VERSION CORRIGÉE

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal


def calculate_user_score(user):
    """
    Calcule le Score Yoonu Dal pour un utilisateur
    Retourne l'objet YoonuScore
    """
    from .models import YoonuScore, ScoreHistory, Expense, Income, Envelope, UserValue

    # Récupérer ou créer le score
    score_obj, created = YoonuScore.objects.get_or_create(user=user)

    # Période d'analyse : mois en cours
    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Récupérer les valeurs prioritaires de l'utilisateur (top 3)
    user_values = UserValue.objects.filter(user=user).order_by('priority')[:3]

    if not user_values.exists():
        # Pas encore de diagnostic fait
        score_obj.total_score = 0
        score_obj.save()
        return None

    # ========== 1. ALIGNEMENT VALEURS (35 points) ==========

    # Mapping catégories → valeurs
    CATEGORY_TO_VALUE = {
        'famille': ['famille', 'alimentation', 'logement'],
        'spiritualite': ['spiritualité'],
        'education': ['éducation'],
        'sante': ['santé'],
        'travail': ['transport'],
        'loisirs': ['loisirs', 'vêtements'],
        'communaute': ['famille'],
    }

    # Calculer les dépenses par valeur
    expenses = Expense.objects.filter(user=user, date__gte=start_of_month)
    total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0

    if total_expenses == 0:
        alignment_score = 0
        alignment_details = {}
    else:
        alignment_details = {}
        alignment_total = 0

        for user_value in user_values:
            value_key = user_value.value  # 'famille', 'spiritualite', etc.

            # Trouver les catégories liées à cette valeur
            related_categories = CATEGORY_TO_VALUE.get(value_key, [])

            # Calculer % dépenses pour cette valeur
            value_expenses = expenses.filter(category__in=related_categories).aggregate(
                total=Sum('amount')
            )['total'] or 0

            value_percentage = (value_expenses / total_expenses * 100) if total_expenses > 0 else 0
            alignment_details[value_key] = float(round(value_percentage, 1))

            # Score basé sur priorité
            if user_value.priority == 1:
                expected_min = 25
                if value_percentage >= expected_min:
                    alignment_total += 15
                else:
                    alignment_total += (value_percentage / expected_min) * 15

            elif user_value.priority == 2:
                expected_min = 15
                if value_percentage >= expected_min:
                    alignment_total += 12
                else:
                    alignment_total += (value_percentage / expected_min) * 12

            elif user_value.priority == 3:
                expected_min = 10
                if value_percentage >= expected_min:
                    alignment_total += 8
                else:
                    alignment_total += (value_percentage / expected_min) * 8

        alignment_score = min(alignment_total, 35)

    # ========== 2. DISCIPLINE BUDGÉTAIRE (35 points) ==========

    envelopes = Envelope.objects.filter(user=user, is_active=True)

    if not envelopes.exists():
        discipline_score = 0
    else:
        discipline_total = 0
        overruns = 0

        for envelope in envelopes:
            budget = float(envelope.monthly_budget)
            spent = float(envelope.current_spent)

            if budget == 0:
                continue

            usage_pct = (spent / budget) * 100

            if usage_pct <= 80:
                discipline_total += 12
            elif usage_pct <= 100:
                discipline_total += 10
            elif usage_pct <= 120:
                discipline_total += 5
                overruns += 1
            else:
                overruns += 1

        if overruns > 0:
            discipline_total -= (overruns * 3)

        discipline_score = max(0, min(discipline_total, 35))

    # ========== 3. STABILITÉ FINANCIÈRE (20 points) ==========

    monthly_income = Income.objects.filter(
        user=user, date__gte=start_of_month
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Convertir en float pour éviter les erreurs
    monthly_income = float(monthly_income)
    monthly_expenses_total = float(total_expenses)

    stability_total = 0

    if monthly_income > monthly_expenses_total:
        stability_total += 10
    elif monthly_income > monthly_expenses_total * 0.9:
        stability_total += 7
    elif monthly_income > monthly_expenses_total * 0.8:
        stability_total += 5

    savings = monthly_income - monthly_expenses_total
    if savings > 0:
        savings_rate = (savings / monthly_income) * 100 if monthly_income > 0 else 0

        if savings_rate >= 20:
            stability_total += 10
        elif savings_rate >= 10:
            stability_total += 7
        elif savings_rate >= 5:
            stability_total += 5
        else:
            stability_total += 3

    stability_score = min(stability_total, 20)

    # ========== 4. AMÉLIORATION CONTINUE (10 points) ==========

    # Calculer la date du mois dernier
    last_month = start_of_month - timedelta(days=1)
    last_month_start = last_month.replace(day=1)

    try:
        # ✅ CORRECTION : Utiliser snapshot_date au lieu de month
        last_score_entry = ScoreHistory.objects.filter(
            user=user,
            snapshot_date__gte=last_month_start,
            snapshot_date__lt=start_of_month
        ).order_by('-snapshot_date').first()

        last_score = last_score_entry.total_score if last_score_entry else 0
    except Exception:
        last_score = 0

    current_total = alignment_score + discipline_score + stability_score

    if last_score == 0:
        improvement_score = 5
    else:
        improvement = current_total - last_score

        if improvement >= 10:
            improvement_score = 10
        elif improvement >= 5:
            improvement_score = 8
        elif improvement > 0:
            improvement_score = 6
        elif improvement == 0:
            improvement_score = 5
        else:
            improvement_score = 3

    # ========== TOTAL ==========

    total_score = int(alignment_score + discipline_score + stability_score + improvement_score)

    # Mettre à jour le modèle YoonuScore
    score_obj.previous_score = score_obj.total_score
    score_obj.total_score = total_score
    score_obj.alignment_score = Decimal(str(round(alignment_score, 2)))
    score_obj.discipline_score = Decimal(str(round(discipline_score, 2)))
    score_obj.stability_score = Decimal(str(round(stability_score, 2)))
    score_obj.improvement_score = Decimal(str(round(improvement_score, 2)))
    score_obj.alignment_details = {k: float(v) for k, v in alignment_details.items()}
    score_obj.score_change = total_score - score_obj.previous_score
    score_obj.save()

    # ✅ CORRECTION : Sauvegarder dans l'historique avec snapshot_date
    # Utiliser la date du jour comme snapshot_date
    today = now.date()

    ScoreHistory.objects.update_or_create(
        user=user,
        snapshot_date=today,  # ✅ Utiliser snapshot_date au lieu de month
        defaults={
            'total_score': total_score,
            'budget_score': int(round(discipline_score)),  # ✅ Nouveau champ
            'savings_score': int(round(stability_score)),  # ✅ Nouveau champ
            'discipline_score': int(round(alignment_score)),  # ✅ Nouveau champ
            'monthly_income': Decimal(str(monthly_income)),  # ✅ Nouveau champ
            'total_expenses': Decimal(str(monthly_expenses_total)),  # ✅ Nouveau champ
            'savings_rate': Decimal(str(round(savings / monthly_income * 100 if monthly_income > 0 else 0, 2)))
            # ✅ Nouveau champ
        }
    )

    return score_obj