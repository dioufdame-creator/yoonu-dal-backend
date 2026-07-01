# ==========================================
# api/views_admin.py — Tableau de bord admin
# ==========================================

from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from django.contrib.auth.models import User
from datetime import timedelta
from dateutil.relativedelta import relativedelta

from .models import (
    UserProfile, Income, Expense, Tontine, TontineParticipant,
    TontineContribution, Goal, AIConversation, AIMessage, AIMemory,
    DiagnosticResult, UserValue, Envelope
)


@staff_member_required
def admin_dashboard(request):
    now = timezone.now()
    today = now.date()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_week = now - timedelta(days=now.weekday())
    last_month_start = (start_of_month - relativedelta(months=1))
    last_month_end = start_of_month - timedelta(seconds=1)

    # ── UTILISATEURS ─────────────────────────────────────────
    total_users = User.objects.count()
    new_users_month = User.objects.filter(date_joined__gte=start_of_month).count()
    new_users_week = User.objects.filter(date_joined__gte=start_of_week).count()
    new_users_today = User.objects.filter(date_joined__date=today).count()

    premium_users = UserProfile.objects.filter(
        subscription_tier='premium',
        subscription_expires_at__gt=now
    ).count()

    trial_users = UserProfile.objects.filter(
        trial_active=True,
        trial_expires_at__gt=now
    ).count()

    free_users = total_users - premium_users - trial_users

    # Utilisateurs actifs = ont enregistré une dépense ou revenu ce mois
    active_users_month = User.objects.filter(
        Q(expenses__date__gte=start_of_month.date()) |
        Q(incomes__date__gte=start_of_month.date())
    ).distinct().count()

    active_users_last_month = User.objects.filter(
        Q(expenses__date__gte=last_month_start.date(), expenses__date__lte=last_month_end.date()) |
        Q(incomes__date__gte=last_month_start.date(), incomes__date__lte=last_month_end.date())
    ).distinct().count()

    # Rétention = actifs ce mois / actifs mois dernier
    retention_rate = round((active_users_month / active_users_last_month * 100) if active_users_last_month > 0 else 0, 1)

    # Onboarding complété
    onboarding_done = UserProfile.objects.filter(onboarding_completed=True).count()
    onboarding_rate = round((onboarding_done / total_users * 100) if total_users > 0 else 0, 1)

    # ── TRANSACTIONS ─────────────────────────────────────────
    total_expenses_month = Expense.objects.filter(date__gte=start_of_month.date()).aggregate(
        total=Sum('amount'), count=Count('id')
    )
    total_incomes_month = Income.objects.filter(date__gte=start_of_month.date()).aggregate(
        total=Sum('amount'), count=Count('id')
    )

    expenses_last_month = Expense.objects.filter(
        date__gte=last_month_start.date(), date__lte=last_month_end.date()
    ).aggregate(total=Sum('amount'), count=Count('id'))

    avg_expenses_per_user = round(
        (float(total_expenses_month['total'] or 0) / active_users_month)
        if active_users_month > 0 else 0, 0
    )

    # Top catégories ce mois
    top_categories = Expense.objects.filter(
        date__gte=start_of_month.date()
    ).values('category').annotate(
        total=Sum('amount'), count=Count('id')
    ).order_by('-total')[:8]

    # ── IA CHAT ───────────────────────────────────────────────
    total_conversations = AIConversation.objects.filter(is_active=True).count()
    conversations_month = AIConversation.objects.filter(
        created_at__gte=start_of_month
    ).count()
    total_ai_messages = AIMessage.objects.count()
    ai_messages_month = AIMessage.objects.filter(
        created_at__gte=start_of_month
    ).count()

    # Utilisateurs ayant utilisé l'IA ce mois
    ai_users_month = AIConversation.objects.filter(
        created_at__gte=start_of_month, is_active=True
    ).values('user').distinct().count()

    ai_adoption_rate = round((ai_users_month / active_users_month * 100) if active_users_month > 0 else 0, 1)

    avg_messages_per_conv = round(
        (total_ai_messages / total_conversations) if total_conversations > 0 else 0, 1
    )

    # ── TONTINES ─────────────────────────────────────────────
    total_tontines = Tontine.objects.count()
    active_tontines = Tontine.objects.filter(status='active').count()
    planning_tontines = Tontine.objects.filter(status='planning').count()
    total_tontine_participants = TontineParticipant.objects.filter(is_active=True).count()
    total_contributions = TontineContribution.objects.filter(
        status='confirmed'
    ).aggregate(total=Sum('amount'))['total'] or 0

    # ── OBJECTIFS ─────────────────────────────────────────────
    total_goals = Goal.objects.count()
    achieved_goals = Goal.objects.filter(is_achieved=True).count()
    active_goals = Goal.objects.filter(is_achieved=False).count()
    total_goal_savings = Goal.objects.aggregate(total=Sum('current_amount'))['total'] or 0

    # ── ENGAGEMENT ────────────────────────────────────────────
    # Utilisateurs avec valeurs définies
    users_with_values = UserValue.objects.values('user').distinct().count()
    values_adoption = round((users_with_values / total_users * 100) if total_users > 0 else 0, 1)

    # Utilisateurs avec diagnostic
    users_with_diagnostic = DiagnosticResult.objects.values('user').distinct().count()
    diagnostic_adoption = round((users_with_diagnostic / total_users * 100) if total_users > 0 else 0, 1)

    # ── CROISSANCE MENSUELLE (6 mois) ─────────────────────────
    growth_data = []
    for i in range(5, -1, -1):
        m_start = (start_of_month - relativedelta(months=i))
        m_end = (m_start + relativedelta(months=1)) - timedelta(seconds=1)
        count = User.objects.filter(
            date_joined__gte=m_start,
            date_joined__lte=m_end
        ).count()
        growth_data.append({
            'month': m_start.strftime('%b %Y'),
            'new_users': count,
        })

    # ── UTILISATEURS LES PLUS ACTIFS ─────────────────────────
    top_users = User.objects.annotate(
        expense_count=Count('expenses', filter=Q(expenses__date__gte=start_of_month.date())),
        income_count=Count('incomes', filter=Q(incomes__date__gte=start_of_month.date())),
    ).filter(
        Q(expense_count__gt=0) | Q(income_count__gt=0)
    ).order_by('-expense_count')[:10]

    top_users_data = []
    for u in top_users:
        try:
            profile = u.profile
            is_premium = profile.is_premium_active()
            tier = '✅ Premium' if profile.subscription_tier == 'premium' else ('🔶 Trial' if profile.trial_active else '❌ Free')
        except:
            tier = '—'
            is_premium = False

        ai_conv_count = AIConversation.objects.filter(user=u, created_at__gte=start_of_month).count()

        top_users_data.append({
            'username': u.username,
            'first_name': u.first_name,
            'expense_count': u.expense_count,
            'income_count': u.income_count,
            'ai_conversations': ai_conv_count,
            'tier': tier,
            'date_joined': u.date_joined.strftime('%d/%m/%Y'),
        })

    # ── ALERTES PRODUIT ───────────────────────────────────────
    alerts = []

    # Utilisateurs inscrits mais jamais actifs
    never_active = User.objects.exclude(
        Q(expenses__isnull=False) | Q(incomes__isnull=False)
    ).count()
    if never_active > 0:
        alerts.append({
            'type': 'warning',
            'message': f'{never_active} utilisateur(s) inscrit(s) mais sans aucune transaction',
            'action': 'Envoyer un email de réactivation'
        })

    # Trials qui expirent dans 7 jours
    expiring_trials = UserProfile.objects.filter(
        trial_active=True,
        trial_expires_at__lte=now + timedelta(days=7),
        trial_expires_at__gt=now
    ).count()
    if expiring_trials > 0:
        alerts.append({
            'type': 'info',
            'message': f'{expiring_trials} trial(s) expirent dans 7 jours',
            'action': 'Contacter pour conversion Premium'
        })

    # Utilisateurs premium expirés
    expired_premium = UserProfile.objects.filter(
        subscription_tier='premium',
        subscription_expires_at__lt=now
    ).count()
    if expired_premium > 0:
        alerts.append({
            'type': 'danger',
            'message': f'{expired_premium} abonnement(s) Premium expiré(s)',
            'action': 'Relancer ou rétrograder'
        })

    context = {
        # Utilisateurs
        'total_users': total_users,
        'new_users_month': new_users_month,
        'new_users_week': new_users_week,
        'new_users_today': new_users_today,
        'premium_users': premium_users,
        'trial_users': trial_users,
        'free_users': free_users,
        'active_users_month': active_users_month,
        'retention_rate': retention_rate,
        'onboarding_done': onboarding_done,
        'onboarding_rate': onboarding_rate,

        # Transactions
        'expenses_count_month': total_expenses_month['count'] or 0,
        'expenses_total_month': float(total_expenses_month['total'] or 0),
        'expenses_count_last_month': expenses_last_month['count'] or 0,
        'incomes_count_month': total_incomes_month['count'] or 0,
        'incomes_total_month': float(total_incomes_month['total'] or 0),
        'avg_expenses_per_user': avg_expenses_per_user,
        'top_categories': top_categories,

        # IA
        'total_conversations': total_conversations,
        'conversations_month': conversations_month,
        'total_ai_messages': total_ai_messages,
        'ai_messages_month': ai_messages_month,
        'ai_users_month': ai_users_month,
        'ai_adoption_rate': ai_adoption_rate,
        'avg_messages_per_conv': avg_messages_per_conv,

        # Tontines
        'total_tontines': total_tontines,
        'active_tontines': active_tontines,
        'planning_tontines': planning_tontines,
        'total_tontine_participants': total_tontine_participants,
        'total_contributions': float(total_contributions),

        # Objectifs
        'total_goals': total_goals,
        'achieved_goals': achieved_goals,
        'active_goals': active_goals,
        'total_goal_savings': float(total_goal_savings),

        # Engagement
        'users_with_values': users_with_values,
        'values_adoption': values_adoption,
        'users_with_diagnostic': users_with_diagnostic,
        'diagnostic_adoption': diagnostic_adoption,

        # Croissance
        'growth_data': growth_data,

        # Top users
        'top_users': top_users_data,

        # Alertes
        'alerts': alerts,

        # Meta
        'generated_at': now.strftime('%d/%m/%Y à %H:%M'),
        'current_month': now.strftime('%B %Y'),
    }

    return render(request, 'admin/dashboard.html', context)
