# api/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from . import payment_views
from . import export_views
from . import notification_views
from .notification_views import register_fcm_token, unregister_fcm_token, check_and_notify, test_notification

from .views import (
    ai_conversations,
    ai_conversation_detail,
    ai_memory,
    ai_chat_v2,
    get_category_rules,      # ← ajouter
    update_category_rule,    # ← ajouter
    reset_category_rules,
)

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

    # Objectifs
    path('goals/', views.user_goals, name='user_goals'),
    path('goals/manage/', views.manage_goals, name='manage_goals'),

    # Valeurs personnelles
    path('values/', views.user_values, name='user_values'),
    path('user-values/', views.delete_user_values, name='delete_user_values'),

    # Tontines
    path('tontines/', views.manage_tontines, name='manage_tontines'),
    path('tontines/active/', views.active_tontines, name='active_tontines'),
    path('tontines/join/', views.join_tontine, name='join_tontine'),
    path('tontines/invite/<str:invitation_code>/', views.tontine_public_info, name='tontine_public_info'),
    path('tontines/<int:tontine_id>/', views.tontine_detail, name='tontine_detail'),
    path('tontines/<int:tontine_id>/activate/', views.activate_tontine, name='activate_tontine'),
    path('tontines/<int:tontine_id>/contribute/', views.make_contribution, name='make_contribution'),
    path('tontines/<int:tontine_id>/participants/', views.tontine_participants, name='tontine_participants'),
    path('tontines/<int:tontine_id>/positions/', views.update_positions, name='update_positions'),
    path('tontines/<int:tontine_id>/timeline/', views.tontine_timeline, name='tontine_timeline'),
    path('tontines/<int:tontine_id>/activity/', views.tontine_activity_feed, name='tontine_activity'),
    path('tontines/<int:tontine_id>/manage-order/', views.tontine_manage_order, name='tontine_manage_order'),
    path('tontines/<int:tontine_id>/contributions/pending/', views.tontine_pending_contributions, name='tontine_pending_contributions'),
    path('tontine-contributions/<int:contribution_id>/validate/', views.validate_contribution, name='validate_contribution'),

    # Diagnostic
    path('diagnostic/save/', views.save_diagnostic, name='save_diagnostic'),
    path('diagnostic/history/', views.get_diagnostic_history, name='diagnostic_history'),

    # Enveloppes
    path('envelopes/analysis/', views.envelope_analysis, name='envelope_analysis'),
    path('meta-envelopes/', views.manage_meta_envelopes, name='manage_meta_envelopes'),

    # Fuites financières
    path('financial-leaks/', views.manage_financial_leaks, name='manage_financial_leaks'),

    # IA
    path('ai/chat/', views.ai_chat, name='ai_chat'),
    path('ai/execute-action/', views.ai_execute_action, name='ai_execute_action'),
    path('ai/scan-receipt/', views.scan_receipt, name='scan_receipt'),

    # Prédictions / Alertes
    path('predictions/', views.generate_predictions, name='generate_predictions'),
    path('predictions/<int:alert_id>/dismiss/', views.dismiss_alert, name='dismiss_alert'),
    path('predictions/<int:alert_id>/execute/', views.execute_prediction_action, name='execute_prediction'),
    path('alerts/', views.generate_predictions, name='alerts'),

    # Score Yoonu
    path('yoonu-score/', views.get_yoonu_score, name='get_yoonu_score'),
    path('yoonu-score/history/', views.get_score_history, name='get_score_history'),
    path('score-history/', views.score_history, name='score_history'),
    path('calculate-score/', views.trigger_score_calculation, name='trigger_score_calculation'),

    # Paiements — PayDunya
    path('payments/create/', payment_views.create_payment, name='create_payment'),
    path('payments/ipn/', payment_views.paydunya_ipn, name='paydunya_ipn'),
    path('payments/status/<str:transaction_id>/', payment_views.check_payment_status, name='payment_status'),
    path('payments/start-trial/', payment_views.start_trial, name='start_trial'),
    path('payments/subscription-status/', payment_views.subscription_status, name='subscription_status'),
    path('payments/transactions/', payment_views.transaction_history, name='transaction_history'),

    # Onboarding
    path('onboarding/status/', views.check_onboarding_status, name='check_onboarding_status'),
    path('onboarding/complete/', views.complete_onboarding, name='complete_onboarding'),

    # Export
    path('export/excel/', export_views.export_excel, name='export_excel'),
    path('export/pdf/', export_views.export_pdf, name='export_pdf'),

    # Dettes
    path('debts/', views.manage_debts, name='manage_debts'),
    path('debts/stats/', views.debt_stats, name='debt_stats'),
    path('debts/<int:debt_id>/', views.debt_detail, name='debt_detail'),
    path('debts/<int:debt_id>/payments/', views.debt_payments, name='debt_payments'),
    path('debts/payments/<int:payment_id>/', views.delete_debt_payment, name='delete_debt_payment'),

    # Mois disponibles
    path('available-months/', views.available_months, name='available_months'),
    

    path('register-fcm-token/', register_fcm_token),
    path('unregister-fcm-token/', unregister_fcm_token),
    path('notifications/check/', notification_views.check_and_notify),
    path('notifications/test/', notification_views.test_notification),

    path('goals/<int:goal_id>/contributions/', views.goal_payments),
    path('goals/contributions/<int:payment_id>/', views.delete_goal_payment),

    path('incomes/<int:income_id>/', views.income_detail, name='income_detail'),

    path('ai/chat/v2/', ai_chat_v2, name='ai_chat_v2'),
    path('ai/conversations/', ai_conversations, name='ai_conversations'),
    path('ai/conversations/<int:conversation_id>/', ai_conversation_detail, name='ai_conversation_detail'),
    path('ai/memory/', ai_memory, name='ai_memory'),

    path('category-rules/', get_category_rules, name='get_category_rules'),
    path('category-rules/update/', update_category_rule, name='update_category_rule'),
    path('category-rules/reset/', reset_category_rules, name='reset_category_rules'),

]
