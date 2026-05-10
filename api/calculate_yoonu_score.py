# api/calculate_yoonu_score.py
# Fonction de calcul du Score Yoonu Dal - VERSION UNIFIÉE
# ✅ Logique cohérente sur 4 niveaux : Débutant / En chemin / Aligné / Maître Yoonu
# ✅ Pas de score de base gratuit
# ✅ Score 0 si pas de données

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal


# ==========================================
# NIVEAUX UNIFIÉS — utilisés partout
# ==========================================

SCORE_LEVELS = [
    { 'min': 80, 'label': 'Maître Yoonu', 'emoji': '🏆', 'color': 'green' },
    { 'min': 60, 'label': 'Aligné',       'emoji': '🌳', 'color': 'blue'  },
    { 'min': 40, 'label': 'En chemin',    'emoji': '🌿', 'color': 'amber' },
    { 'min':  1, 'label': 'Débutant',     'emoji': '🌱', 'color': 'red'   },
    { 'min':  0, 'label': 'Non évalué',   'emoji': '⬜', 'color': 'gray'  },
]

SCORE_MESSAGES = {
    'Maître Yoonu': 'Excellence ! Tu maîtrises parfaitement l\'art de Yoonu Dal.',
    'Aligné':       'Très bien ! Tes finances sont alignées avec tes valeurs.',
    'En chemin':    'Tu progresses. Continue d\'aligner tes dépenses avec tes valeurs.',
    'Débutant':     'C\'est le début du voyage. Enregistre tes dépenses pour progresser.',
    'Non évalué':   'Enregistre tes dépenses pour activer ton score Yoonu Dal.',
}


def get_level(score):
    """Retourne le niveau unifié basé sur le score"""
    for level in SCORE_LEVELS:
        if score >= level['min']:
            return level
    return SCORE_LEVELS[-1]


def get_label_from_score(score):
    return get_level(score)['label']


def get_emoji_from_score(score):
    return get_level(score)['emoji']


def get_message_from_score(score):
    label = get_label_from_score(score)
    return SCORE_MESSAGES.get(label, '')


# ==========================================
# CALCUL PRINCIPAL
# ==========================================

def calculate_yoonu_score(user):
    """
    Calcule le Score Yoonu Dal pour un utilisateur.
    Retourne un DICT avec le score et ses composantes.
    Score 0 si pas de données suffisantes — pas de score gratuit.
    """
    from .models import YoonuScore, ScoreHistory, Expense, Income, Envelope, UserValue

    score_obj, created = YoonuScore.objects.get_or_create(user=user)

    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    user_values = UserValue.objects.filter(user=user).order_by('priority')[:3]

    # ✅ Pas de valeurs définies → score 0
    if not user_values.exists():
        score_obj.total_score = 0
        score_obj.save()
        return _build_result(score_obj, 0, 0, 0, 0, 0, {})

    expenses = Expense.objects.filter(user=user, date__gte=start_of_month)
    total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0

    # ✅ Pas de dépenses → score 0, message incitatif
    if total_expenses == 0:
        score_obj.total_score = 0
        score_obj.save()
        return _build_result(score_obj, 0, 0, 0, 0, 0, {})

    # ========== 1. ALIGNEMENT VALEURS (35 points) ==========

    CATEGORY_TO_VALUE = {
        'famille': [
            'solidarite_famille',
            'fetes_ceremonies',
            'alimentation',
            'loyer',
            'aide_menagere',
        ],
        'spiritualite': [
            'spiritualite',
            'fetes_ceremonies',
        ],
        'education': [
            'education',
            'immobilier',
        ],
        'sante': [
            'sante_courante',
            'sante_exceptionnelle',
        ],
        'travail': [
            'transport',
            'telephone_internet',
        ],
        'loisirs': [
            'loisirs',
            'restaurant',
            'voyage',
            'vetements',
            'beaute',
        ],
        'communaute': [
            'solidarite_famille',
            'fetes_ceremonies',
            'tontine_epargne',
        ],
    }

    alignment_details = {}
    alignment_total = 0

    for user_value in user_values:
        value_key = user_value.value
        related_categories = CATEGORY_TO_VALUE.get(value_key, [])

        value_expenses = expenses.filter(category__in=related_categories).aggregate(
            total=Sum('amount')
        )['total'] or 0

        value_percentage = (float(value_expenses) / float(total_expenses) * 100) if total_expenses > 0 else 0
        alignment_details[value_key] = round(value_percentage, 1)

        if user_value.priority == 1:
            expected_min = 25
            alignment_total += min(15, (value_percentage / expected_min) * 15)
        elif user_value.priority == 2:
            expected_min = 15
            alignment_total += min(12, (value_percentage / expected_min) * 12)
        elif user_value.priority == 3:
            expected_min = 10
            alignment_total += min(8, (value_percentage / expected_min) * 8)

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

    monthly_income = float(
        Income.objects.filter(user=user, date__gte=start_of_month)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    monthly_expenses_total = float(total_expenses)

    stability_total = 0

    if monthly_income > monthly_expenses_total:
        stability_total += 10
    elif monthly_income > monthly_expenses_total * 0.9:
        stability_total += 7
    elif monthly_income > monthly_expenses_total * 0.8:
        stability_total += 5

    savings = monthly_income - monthly_expenses_total
    if savings > 0 and monthly_income > 0:
        savings_rate = (savings / monthly_income) * 100
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

    last_month = start_of_month - timedelta(days=1)
    last_month_start = last_month.replace(day=1)

    try:
        last_score = ScoreHistory.objects.get(user=user, month=last_month_start).total_score
    except ScoreHistory.DoesNotExist:
        last_score = None

    current_subtotal = alignment_score + discipline_score + stability_score

    if last_score is None:
        # Premier mois avec des données : score de base pour l'amélioration
        improvement_score = 5
    else:
        improvement = current_subtotal - last_score
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

    # Sauvegarder
    score_obj.previous_score = score_obj.total_score
    score_obj.total_score = total_score
    score_obj.alignment_score = Decimal(str(round(alignment_score, 2)))
    score_obj.discipline_score = Decimal(str(round(discipline_score, 2)))
    score_obj.stability_score = Decimal(str(round(stability_score, 2)))
    score_obj.improvement_score = Decimal(str(round(improvement_score, 2)))
    score_obj.alignment_details = {k: float(v) for k, v in alignment_details.items()}
    score_obj.score_change = total_score - score_obj.previous_score
    score_obj.save()

    ScoreHistory.objects.update_or_create(
        user=user,
        month=start_of_month,
        defaults={
            'total_score': total_score,
            'alignment_score': Decimal(str(round(alignment_score, 2))),
            'discipline_score': Decimal(str(round(discipline_score, 2))),
            'stability_score': Decimal(str(round(stability_score, 2))),
            'improvement_score': Decimal(str(round(improvement_score, 2)))
        }
    )

    return _build_result(
        score_obj, total_score,
        alignment_score, discipline_score, stability_score, improvement_score,
        alignment_details
    )


def _build_result(score_obj, total_score, alignment_score, discipline_score,
                  stability_score, improvement_score, alignment_details):
    """Construit le dict de retour unifié"""
    level = get_level(total_score)
    return {
        'total_score': total_score,
        'alignment_score': float(alignment_score),
        'discipline_score': float(discipline_score),
        'stability_score': float(stability_score),
        'improvement_score': float(improvement_score),
        'score_change': score_obj.score_change if score_obj else 0,
        'level': level['label'],
        'emoji': level['emoji'],
        'color': level['color'],
        'message': SCORE_MESSAGES.get(level['label'], ''),
        'alignment_details': alignment_details,
    }
