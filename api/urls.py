# api/urls.py - VERSION CHIRURGICALE
# Ton ancien fichier EXACT avec juste les imports Goals Phase 2 commentés

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from . import payment_views
from . import export_views

# ❌ COMMENTÉ - Ces fonctions n'existent pas dans views.py
# from .views import (
#     goal_contributions,
#     goal_auto_allocation,
#     goal_milestones,
#     execute_auto_allocations,
#     goals_stats,
# )

urlpatterns = [
    # API racine
    path('', views.api_root, name='api_root'),

    # Authentification
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.register_user, name='register'),
    path('profile/', views.user_profile, name='user_profile'),

    # Dashboard
    path('dashboard/metrics/', views.dashboard_metrics, name='dashboard_metrics'),
    path('dashboard/alignment/', views.dashboard_alignment, name='dashboard_alignment'),

    # Transactions
    path('transactions/recent/', views.recent_transactions, name='recent_transactions'),
    path('incomes/', views.manage_incomes, name='manage_incomes'),
    path('expenses/', views.manage_expenses, name='manage_expenses'),
    path('expenses/<int:expense_id>/', views.expense_detail, name='expense_detail'),
    path('budgets/', views.manage_budgets, name='manage_budgets'),
    path('budget/overview/', views.budget_overview, name='budget_overview'),

    # Objectifs & épargne
    path('goals/', views.user_goals, name='user_goals'),
    path('goals/manage/', views.manage_goals, name='manage_goals'),
    
    # ❌ COMMENTÉ - Phase 2 - Goals (fonctions manquantes)
    # path('goals/<int:goal_id>/contributions/', goal_contributions, name='goal-contributions'),
    # path('goals/<int:goal_id>/auto-allocation/', goal_auto_allocation, name='goal-auto-allocation'),
    # path('goals/<int:goal_id>/milestones/', goal_milestones, name='goal-milestones'),
    # path('goals/execute-allocations/', execute_auto_allocations, name='execute-auto-allocations'),
    # path('goals/stats/', goals_stats, name='goals-stats'),

    # Valeurs personnelles
    path('values/', views.user_values, name='user_values'),

    # Tontines
    path('tontines/', views.manage_tontines, name='manage_tontines'),
    path('tontines/active/', views.active_tontines, name='active_tontines'),
    path('tontines/join/', views.join_tontine, name='join_tontine'),
    path('tontines/<int:tontine_id>/', views.tontine_detail, name='tontine_detail'),
    path('tontines/<int:tontine_id>/activate/', views.activate_tontine, name='activate_tontine'),
    path('tontines/<int:tontine_id>/contribute/', views.make_contribution, name='make_contribution'),
    path('tontines/<int:tontine_id>/participants/', views.tontine_participants, name='tontine_participants'),
    path('tontines/<int:tontine_id>/positions/', views.update_positions, name='update_positions'),

    # Diagnostic
    path('diagnostic/save/', views.save_diagnostic, name='save_diagnostic'),
    path('diagnostic/history/', views.get_diagnostic_history, name='diagnostic_history'),

    # Enveloppes
    path('envelopes/analysis/', views.envelope_analysis, name='envelope_analysis'),

    # Fuites financières
    path('financial-leaks/', views.manage_financial_leaks, name='manage_financial_leaks'),
    
    # IA
    path('ai/chat/', views.ai_chat, name='ai_chat'),
    path('ai/execute-action/', views.ai_execute_action, name='ai_execute_action'),
    path('ai/scan-receipt/', views.scan_receipt, name='scan_receipt'),
    
    # Prédictions
    path('predictions/', views.generate_predictions, name='generate_predictions'),
    path('predictions/<int:alert_id>/dismiss/', views.dismiss_alert, name='dismiss_alert'),
    path('predictions/<int:alert_id>/execute/', views.execute_prediction_action, name='execute_prediction'),
    
    # Score Yoonu
    path('yoonu-score/', views.get_yoonu_score, name='get_yoonu_score'),
    path('yoonu-score/history/', views.get_score_history, name='get_score_history'),
    path('user-values/', views.user_values, name='user_values'),
    path('calculate-score/', views.trigger_score_calculation, name='trigger_score_calculation'),
    
    # Paiements
    path('payments/mobile-money/', payment_views.mobile_money_payment, name='mobile_money'),
    path('payments/card/', payment_views.card_payment, name='card_payment'),
    path('payments/status/<str:transaction_id>/', payment_views.check_payment_status, name='payment_status'),
    path('payments/start-trial/', payment_views.start_trial, name='start_trial'),
    path('payments/subscription-status/', payment_views.subscription_status, name='subscription_status'),
    
    # Onboarding
    path('onboarding/status/', views.check_onboarding_status, name='check_onboarding_status'),
    path('onboarding/complete/', views.complete_onboarding, name='complete_onboarding'),
    
    # Export
    path('export/excel/', export_views.export_excel),
    path('export/pdf/', export_views.export_pdf),
    
    # Score history
    path('score-history/', views.score_history),
    
    # Meta-enveloppes
    path('meta-envelopes/', views.manage_meta_envelopes, name='manage_meta_envelopes'),
    # Dettes
path('debts/', views.manage_debts, name='manage_debts'),
path('debts/stats/', views.debt_stats, name='debt_stats'),
path('debts/<int:debt_id>/', views.debt_detail, name='debt_detail'),
path('debts/<int:debt_id>/payments/', views.debt_payments, name='debt_payments'),
path('debts/payments/<int:payment_id>/', views.delete_debt_payment, name='delete_debt_payment'),
]
