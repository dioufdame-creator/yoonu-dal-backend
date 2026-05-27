# api/calculate_yoonu_score.py
# Score Yoonu Dal — Système repensé v2
# ✅ 5 composantes : alignement / discipline / stabilité / construction / régularité
# ✅ Barèmes stricts — Maître Yoonu difficile à atteindre
# ✅ Pénalités cohérence valeurs, dépassements, déficits

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal


# ==========================================
# NIVEAUX
# ==========================================

SCORE_LEVELS = [
    { 'min': 85, 'label': 'Maître Yoonu', 'emoji': '🏆', 'color': 'green' },
    { 'min': 70, 'label': 'Aligné',       'emoji': '🌳', 'color': 'blue'  },
    { 'min': 50, 'label': 'En chemin',    'emoji': '🌿', 'color': 'amber' },
    { 'min': 30, 'label': 'Débutant',     'emoji': '🌱', 'color': 'red'   },
    { 'min':  0, 'label': 'Non évalué',   'emoji': '⬜', 'color': 'gray'  },
]

SCORE_MESSAGES = {
    'Maître Yoonu': 'Excellence ! Moins de 5% des utilisateurs atteignent ce niveau.',
    'Aligné':       'Solide ! Tu maîtrises les bases et construis ton avenir.',
    'En chemin':    'Tu progresses. Des zones à améliorer pour atteindre le niveau supérieur.',
    'Débutant':     'Les fondations se posent. Continue d\'enregistrer tes dépenses.',
    'Non évalué':   'Pas assez de données. Enregistre tes dépenses et revenus ce mois.',
}

# Mapping valeurs → catégories (strict — uniquement catégories directement liées)
CATEGORY_TO_VALUE = {
    'famille': [
        'solidarite_famille',
        'fetes_ceremonies',
        'aide_menagere',
    ],
    'spiritualite': [
        'spiritualite',
    ],
    'education': [
        'education',
    ],
    'sante': [
        'sante_courante',
        'sante_exceptionnelle',
    ],
    'liberte': [
        'transport',
        'voyage',
        'telephone_internet',
    ],
    'securite': [
        'epargne',
        'remboursement_dette',
        'loyer',
    ],
    'solidarite': [
        'solidarite_famille',
        'tontine_epargne',
    ],
    'reussite': [
        'education',
        'epargne',
        'immobilier',
    ],
}


def get_level(score):
    for level in SCORE_LEVELS:
        if score >= level['min']:
            return level
    return SCORE_LEVELS[-1]


def get_label_from_score(score):
    return get_level(score)['label']


def get_emoji_from_score(score):
    return get_level(score)['emoji']


def get_message_from_score(score):
    return SCORE_MESSAGES.get(get_label_from_score(score), '')


# ==========================================
# CALCUL PRINCIPAL
# ==========================================

def calculate_yoonu_score(user):
    """
    Score Yoonu Dal v2 — 5 composantes, 100pts.

    1. Alignement Valeurs      → 25 pts
    2. Discipline Budgétaire   → 25 pts
    3. Stabilité Financière    → 25 pts
    4. Construction Patrimoniale → 15 pts
    5. Régularité & Engagement → 10 pts
    """
    from .models import (
        YoonuScore, ScoreHistory, Expense, Income, Envelope,
        UserValue, Goal, TontineParticipant, TontineContribution,
        Debt, DebtPayment, GoalContribution
    )

    score_obj, _ = YoonuScore.objects.get_or_create(user=user)

    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    user_values = UserValue.objects.filter(user=user).order_by('priority')[:3]

    # Pas de valeurs → score 0
    if not user_values.exists():
        score_obj.total_score = 0
        score_obj.save()
        return _build_result(score_obj, 0, 0, 0, 0, 0, 0, {})

    expenses = Expense.objects.filter(user=user, date__gte=start_of_month.date())
    total_expenses = float(expenses.aggregate(total=Sum('amount'))['total'] or 0)

    # Revenus
    monthly_income = float(
        Income.objects.filter(user=user, date__gte=start_of_month.date())
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    declared_income = float(user.profile.monthly_income or 0)
    reference_income = monthly_income if monthly_income > 0 else declared_income

    # Données suffisantes = au moins 10% du revenu dépensé
    has_sufficient_data = (
        reference_income == 0 or
        total_expenses >= reference_income * 0.10
    )

    # Pas de dépenses → score minimal
    if total_expenses == 0:
        score_obj.total_score = 0
        score_obj.save()
        return _build_result(score_obj, 0, 0, 0, 0, 0, 0, {})

    # ========== 1. ALIGNEMENT VALEURS (25 points) ==========

    alignment_details = {}
    alignment_total = 0.0
    penalties = 0.0

    values_list = list(user_values)
    value_percentages = []

    for i, user_value in enumerate(values_list):
        value_key = user_value.value
        related_categories = CATEGORY_TO_VALUE.get(value_key, [])

        value_expenses = float(
            expenses.filter(category__in=related_categories)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        pct = (value_expenses / total_expenses * 100) if total_expenses > 0 else 0
        alignment_details[value_key] = round(pct, 1)
        value_percentages.append(pct)

        if i == 0:  # Priorité 1 → 10pts max
            if pct >= 20:
                alignment_total += 10
            elif pct >= 10:
                alignment_total += 6
            elif pct >= 5:
                alignment_total += 3
            else:
                alignment_total += 0

        elif i == 1:  # Priorité 2 → 9pts max
            if pct >= 15:
                alignment_total += 9
            elif pct >= 8:
                alignment_total += 5
            elif pct >= 3:
                alignment_total += 2
            else:
                alignment_total += 0

        elif i == 2:  # Priorité 3 → 6pts max
            if pct >= 10:
                alignment_total += 6
            elif pct >= 5:
                alignment_total += 3
            else:
                alignment_total += 0

    # Pénalité cohérence : priorité 1 < priorité 2 en dépenses
    if len(value_percentages) >= 2 and value_percentages[0] < value_percentages[1]:
        penalties += 3

    alignment_score = max(0, min(alignment_total - penalties, 25))

    # ========== 2. DISCIPLINE BUDGÉTAIRE (25 points) ==========

    envelopes = Envelope.objects.filter(user=user, is_active=True)

    if not envelopes.exists() or not has_sufficient_data:
        discipline_score = 0
    else:
        overruns = 0
        severe_overruns = 0
        all_under_70 = True

        for envelope in envelopes:
            budget = float(envelope.monthly_budget)
            if budget == 0:
                continue

            # Recalculer les dépenses réelles de l'enveloppe
            from .views import get_categories_for_envelope
            cats = get_categories_for_envelope(envelope.envelope_type)
            spent = float(
                expenses.filter(category__in=cats)
                .aggregate(total=Sum('amount'))['total'] or 0
            )

            usage_pct = (spent / budget * 100) if budget > 0 else 0

            if usage_pct > 70:
                all_under_70 = False
            if usage_pct > 100:
                overruns += 1
            if usage_pct > 150:
                severe_overruns += 1

        if overruns == 0:
            discipline_total = 25
        elif overruns == 1:
            discipline_total = 18
        elif overruns == 2:
            discipline_total = 10
        else:
            discipline_total = 0

        # Bonus toutes enveloppes ≤70%
        if all_under_70:
            discipline_total += 3

        # Malus dépassement sévère >150%
        discipline_total -= severe_overruns * 5

        discipline_score = max(0, min(discipline_total, 25))

    # ========== 3. STABILITÉ FINANCIÈRE (25 points) ==========

    stability_total = 0.0

    if reference_income > 0 and monthly_income > 0:
        savings = monthly_income - total_expenses
        savings_rate = (savings / monthly_income * 100) if monthly_income > 0 else 0

        # Taux d'épargne → 15pts max
        if savings_rate >= 30:
            stability_total += 15
        elif savings_rate >= 20:
            stability_total += 12
        elif savings_rate >= 10:
            stability_total += 8
        elif savings_rate >= 5:
            stability_total += 4
        else:
            stability_total += 0

        # Revenus vs dépenses → 10pts max
        if monthly_income > total_expenses:
            stability_total += 10
        elif monthly_income >= total_expenses * 0.95:
            stability_total += 5
        else:
            stability_total += 0

        # Malus déficit important
        if total_expenses > monthly_income * 1.20:
            stability_total -= 5

        # Bonus régularité : revenus enregistrés 3 mois consécutifs
        consecutive_months = _count_consecutive_income_months(user, now, 3)
        if consecutive_months >= 3:
            stability_total += 3

        if not has_sufficient_data:
            stability_total = min(stability_total, 5)

    elif reference_income > 0 and monthly_income == 0:
        # Revenu déclaré mais pas enregistré ce mois
        stability_total = 3
    else:
        stability_total = 0

    stability_score = max(0, min(stability_total, 25))

    # ========== 4. CONSTRUCTION PATRIMONIALE (15 points) ==========

    construction_total = 0

    # — Objectifs (5pts max) —
    try:
        active_goals = Goal.objects.filter(user=user, is_achieved=False)
        if active_goals.exists():
            # Contribution à un objectif ce mois
            goal_contributed = GoalContribution.objects.filter(
                goal__user=user,
                goal__is_achieved=False,
                created_at__gte=start_of_month
            ).exists()

            if goal_contributed:
                construction_total += 5
            else:
                construction_total += 2  # Objectif existe mais pas de contribution ce mois

            # Bonus : objectif avancé ≥25%
            advanced_goal = active_goals.filter(
                current_amount__gte=0
            ).first()
            if advanced_goal and advanced_goal.target_amount > 0:
                progress = float(advanced_goal.current_amount) / float(advanced_goal.target_amount) * 100
                if progress >= 25:
                    construction_total += 2
    except Exception:
        pass

    # — Tontines (4pts max) —
    try:
        active_participations = TontineParticipant.objects.filter(
            user=user, tontine__status='active', is_active=True
        )
        if active_participations.exists():
            # Cotisation à jour ce mois
            contribution_this_month = TontineContribution.objects.filter(
                participant__in=active_participations,
                date__gte=start_of_month.date(),
                status__in=['confirmed', 'pending']
            ).exists()

            if contribution_this_month:
                construction_total += 4
            else:
                construction_total += 1  # Tontine active mais cotisation manquante
    except Exception:
        pass

    # — Dettes (4pts max) —
    try:
        active_debts = Debt.objects.filter(user=user, is_active=True)
        if active_debts.exists():
            # Remboursement ce mois
            debt_payment_this_month = DebtPayment.objects.filter(
                debt__user=user,
                payment_date__gte=start_of_month.date()
            ).exists()

            if debt_payment_this_month:
                construction_total += 4
            else:
                # A des dettes mais pas de remboursement ce mois → pénalité
                construction_total -= 3
        else:
            # Pas de dettes = bonne situation
            construction_total += 3
    except Exception:
        pass

    construction_score = max(0, min(construction_total, 15))

    # ========== 5. RÉGULARITÉ & ENGAGEMENT (10 points) ==========

    regularity_total = 0

    # Dépenses enregistrées — nombre de jours distincts ce mois
    try:
        distinct_days = expenses.dates('date', 'day').count()
        if distinct_days >= 15:
            regularity_total += 4
        elif distinct_days >= 8:
            regularity_total += 2
        else:
            regularity_total += 0
    except Exception:
        pass

    # Revenus enregistrés ce mois
    if monthly_income > 0:
        regularity_total += 3

    # Score calculé 3 mois consécutifs
    try:
        consecutive_scores = 0
        for i in range(1, 4):
            check_month = (start_of_month - timedelta(days=1)).replace(day=1)
            for _ in range(i - 1):
                check_month = (check_month - timedelta(days=1)).replace(day=1)
            if ScoreHistory.objects.filter(user=user, month=check_month).exists():
                consecutive_scores += 1
            else:
                break
        if consecutive_scores >= 3:
            regularity_total += 3
        elif consecutive_scores >= 2:
            regularity_total += 2
        elif consecutive_scores >= 1:
            regularity_total += 1
    except Exception:
        pass

    regularity_score = max(0, min(regularity_total, 10))

    # ========== TOTAL ==========

    total_score = int(
        alignment_score + discipline_score + stability_score +
        construction_score + regularity_score
    )
    total_score = max(0, min(total_score, 100))

    # Sauvegarde
    previous = score_obj.total_score
    score_obj.previous_score = previous
    score_obj.total_score = total_score
    score_obj.alignment_score = Decimal(str(round(alignment_score, 2)))
    score_obj.discipline_score = Decimal(str(round(discipline_score, 2)))
    score_obj.stability_score = Decimal(str(round(stability_score, 2)))
    # improvement_score stocke construction+regularity pour compatibilité frontend
    score_obj.improvement_score = Decimal(str(round(construction_score + regularity_score, 2)))
    score_obj.alignment_details = {k: float(v) for k, v in alignment_details.items()}
    score_obj.score_change = total_score - previous
    score_obj.save()

    ScoreHistory.objects.update_or_create(
        user=user,
        month=start_of_month,
        defaults={
            'total_score': total_score,
            'alignment_score': Decimal(str(round(alignment_score, 2))),
            'discipline_score': Decimal(str(round(discipline_score, 2))),
            'stability_score': Decimal(str(round(stability_score, 2))),
            'improvement_score': Decimal(str(round(construction_score + regularity_score, 2))),
        }
    )

    return _build_result(
        score_obj, total_score,
        alignment_score, discipline_score, stability_score,
        construction_score, regularity_score, alignment_details
    )


# ==========================================
# UTILITAIRES
# ==========================================

def _count_consecutive_income_months(user, now, n):
    """Compte le nombre de mois consécutifs avec des revenus enregistrés"""
    from .models import Income
    count = 0
    check = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(n):
        has_income = Income.objects.filter(
            user=user,
            date__gte=check.date(),
            date__lt=(check + timedelta(days=32)).replace(day=1).date()
        ).exists()
        if has_income:
            count += 1
            check = (check - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            break
    return count


def _build_result(score_obj, total_score, alignment_score, discipline_score,
                  stability_score, construction_score, regularity_score, alignment_details):
    level = get_level(total_score)
    return {
        'total_score': total_score,
        'alignment_score': float(alignment_score),
        'discipline_score': float(discipline_score),
        'stability_score': float(stability_score),
        'improvement_score': float(construction_score),   # construction
        'engagement_score': float(regularity_score),      # régularité
        'score_change': score_obj.score_change if score_obj else 0,
        'level': level['label'],
        'emoji': level['emoji'],
        'color': level['color'],
        'message': SCORE_MESSAGES.get(level['label'], ''),
        'alignment_details': alignment_details,
    }
