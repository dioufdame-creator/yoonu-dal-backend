# api/views.py - Version complète

from datetime import datetime, timedelta
from django.db.models import Sum, Avg, Count, Q, Max
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
import json
import logging
from django.shortcuts import get_object_or_404

# Import des modèles
from .models import (
    UserProfile, UserValue, IncomeSource, Income, Expense, Budget,
    Goal, Saving, Tontine, TontineParticipant, TontineContribution,
    TontinePayout, DiagnosticResult, Envelope, FinancialLeak, PredictiveAlert
)
from .utils.decorators import require_premium, check_usage_limit
from .calculate_yoonu_score import calculate_yoonu_score

logger = logging.getLogger(__name__)


# ==========================================
# FONCTIONS UTILITAIRES
# ==========================================


# ==========================================
# VUE RACINE API
# ==========================================

@api_view(['GET'])
def api_root(request):
    """Point d'entrée principal de l'API"""
    return Response({
        'status': 'ok',
        'message': 'Bienvenue sur l\'API Yoonu Dal!',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/token/',
            'register': '/api/register/',
            'profile': '/api/profile/',
            'dashboard_metrics': '/api/dashboard/metrics/',
            'dashboard_alignment': '/api/dashboard/alignment/',
            'recent_transactions': '/api/transactions/recent/',
            'incomes': '/api/incomes/',
            'expenses': '/api/expenses/',
            'budgets': '/api/budgets/',
            'budget_overview': '/api/budget/overview/',
            'goals': '/api/goals/',
            'values': '/api/values/',
            'envelopes': '/api/envelopes/',
            'active_tontines': '/api/tontines/active/',
            'tontines': '/api/tontines/',
            'diagnostic': '/api/diagnostic/save/',
            'financial_leaks': '/api/financial-leaks/',
        }
    })


# ==========================================
# AUTHENTIFICATION
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.data
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']

        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'Le champ {field} est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=data['username']).exists():
            return Response({
                'error': 'Ce nom d\'utilisateur existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=data['email']).exists():
            return Response({
                'error': 'Cette adresse email est déjà utilisée'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )

        return Response({
            'message': 'Utilisateur créé avec succès',
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': f'Erreur lors de la création: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Profil utilisateur"""
    user = request.user

    if request.method == 'GET':
        try:
            profile = user.profile
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined.isoformat()
                },
                'profile': {
                    'phone_number': profile.phone_number,
                    'monthly_income': float(profile.monthly_income),
                    'financial_goals': profile.financial_goals,
                    'risk_tolerance': profile.risk_tolerance,
                    # ✅✅✅ AJOUTER CES CHAMPS ✅✅✅
                    'subscription_tier': profile.subscription_tier,
                    'trial_active': profile.trial_active,
                    'trial_expires_at': profile.trial_expires_at,
                    'trial_used': profile.trial_used,
                    'is_premium': profile.is_premium_active(),
                    'ai_messages_count': profile.ai_messages_count,
                    # ✅✅✅ FIN AJOUT ✅✅✅
                    'onboarding_completed': profile.onboarding_completed,  # ✅ DOIT ÊTRE LÀ
                }
            })
        except Exception as e:
            return Response({
                'error': f'Erreur profil: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:  # PUT
        try:
            data = request.data
            profile = user.profile

            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            user.save()

            if 'phone_number' in data:
                profile.phone_number = data['phone_number']
            if 'monthly_income' in data:
                profile.monthly_income = Decimal(data['monthly_income'])
            profile.save()

            return Response({'message': 'Profil mis à jour'})
        except Exception as e:
            return Response({
                'error': f'Erreur mise à jour: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# DASHBOARD ENDPOINTS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """Métriques principales du dashboard"""
    user = request.user
    current_month = timezone.now().replace(day=1)

    try:
        monthly_income = Income.objects.filter(
            user=user, date__gte=current_month
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_expenses = Expense.objects.filter(
            user=user, date__gte=current_month
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_savings = Saving.objects.filter(
            user=user
        ).aggregate(total=Sum('amount'))['total'] or 0

        active_tontines_count = TontineParticipant.objects.filter(
            user=user, tontine__status='active'
        ).count()

        savings_rate = 0
        expense_ratio = 0
        budget_aligned = False

        if monthly_income > 0:
            monthly_savings = monthly_income - total_expenses
            savings_rate = round((monthly_savings / monthly_income) * 100, 1)
            expense_ratio = round((total_expenses / monthly_income) * 100, 1)
            budget_aligned = expense_ratio <= 80

        return Response({
            'monthly_income': float(monthly_income),
            'total_expenses': float(total_expenses),
            'total_savings': float(total_savings),
            'active_tontines': active_tontines_count,
            'financial_health_score': 75,
            'savings_rate': savings_rate,
            'expense_ratio': expense_ratio,
            'budget_aligned': budget_aligned,
            'tontine_participation': 50
        })

    except Exception as e:
        return Response({
            'error': f'Erreur métriques: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_alignment(request):
    """Triangle d'alignement Yoonu Dal"""
    user = request.user

    try:
        # Calcul des scores basé sur les données réelles
        current_month = timezone.now().replace(day=1)

        # Score revenus : basé sur la diversification des sources
        income_sources_count = Income.objects.filter(
            user=user, date__gte=current_month
        ).values('source').distinct().count()
        revenue_score = min(income_sources_count * 20, 100)  # 20 points par source, max 100

        # Score dépenses : basé sur le respect des enveloppes
        envelopes = Envelope.objects.filter(user=user, is_active=True)
        if envelopes.exists():
            good_envelopes = sum(1 for e in envelopes if e.usage_percentage <= 80)
            expense_score = round((good_envelopes / envelopes.count()) * 100)
        else:
            expense_score = 50

        # Score valeurs : basé sur l'alignement des dépenses avec les valeurs
        user_values = UserValue.objects.filter(user=user)
        values_score = min(user_values.count() * 15, 100)  # 15 points par valeur définie

        overall_alignment = round((revenue_score + expense_score + values_score) / 3, 1)

        recommendations = []
        if revenue_score < 60:
            recommendations.append("Diversifiez vos sources de revenus")
        if expense_score < 60:
            recommendations.append("Optimisez vos dépenses pour respecter vos enveloppes")
        if values_score < 60:
            recommendations.append("Définissez vos valeurs personnelles pour aligner votre budget")
        if not recommendations:
            recommendations.append("Continuez sur votre lancée ! Votre alignement est excellent.")

        return Response({
            'revenue_score': revenue_score,
            'expense_score': expense_score,
            'values_score': values_score,
            'overall_alignment': overall_alignment,
            'recommendations': recommendations
        })

    except Exception as e:
        return Response({
            'error': f'Erreur alignement: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_transactions(request):
    """Transactions récentes"""
    user = request.user
    limit = int(request.GET.get('limit', 10))

    try:
        transactions = []

        incomes = Income.objects.filter(user=user).order_by('-date')[:limit]
        for income in incomes:
            transactions.append({
                'id': f'income_{income.id}',
                'description': income.description,
                'amount': float(income.amount),
                'type': 'income',
                'category': income.source,
                'date': income.date.isoformat(),
                'created_at': income.created_at.isoformat()
            })

        expenses = Expense.objects.filter(user=user).order_by('-date')[:limit]
        for expense in expenses:
            transactions.append({
                'id': f'expense_{expense.id}',
                'description': expense.description,
                'amount': -float(expense.amount),
                'type': 'expense',
                'category': expense.category,
                'date': expense.date.isoformat(),
                'created_at': expense.created_at.isoformat()
            })

        transactions.sort(key=lambda x: x['created_at'], reverse=True)
        return Response(transactions[:limit])

    except Exception as e:
        return Response({
            'error': f'Erreur transactions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# REVENUS
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_incomes(request):
    """Gestion complète des revenus"""
    user = request.user

    if request.method == 'GET':
        try:
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            source = request.GET.get('source')

            incomes = Income.objects.filter(user=user)

            if start_date:
                incomes = incomes.filter(date__gte=start_date)
            if end_date:
                incomes = incomes.filter(date__lte=end_date)
            if source:
                incomes = incomes.filter(source=source)

            incomes = incomes.order_by('-date')

            incomes_data = []
            for income in incomes:
                incomes_data.append({
                    'id': income.id,
                    'source': income.source,
                    'description': income.description,
                    'amount': float(income.amount),
                    'date': income.date.isoformat(),
                    'created_at': income.created_at.isoformat()
                })

            return Response({
                'incomes': incomes_data,
                'total_count': len(incomes_data),
                'total_amount': sum(i['amount'] for i in incomes_data)
            })

        except Exception as e:
            return Response({
                'error': f'Erreur revenus: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:  # POST
        try:
            data = request.data

            if not data.get('source'):
                return Response({
                    'error': 'La source est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not data.get('amount'):
                return Response({
                    'error': 'Le montant est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            income = Income.objects.create(
                user=user,
                source=data.get('source'),
                description=data.get('description', ''),
                amount=Decimal(data.get('amount')),
                date=data.get('date') if data.get('date') else timezone.now().date(),
                is_validated=data.get('is_validated', True)
            )

            return Response({
                'id': income.id,
                'source': income.source,
                'description': income.description,
                'amount': float(income.amount),
                'date': income.date.isoformat(),
                'message': 'Revenu créé avec succès'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Erreur création revenu: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# GESTION DES DÉPENSES
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_expenses(request):
    """Gestion complète des dépenses"""
    user = request.user

    if request.method == 'GET':
        try:
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            category = request.GET.get('category')

            expenses = Expense.objects.filter(user=user)

            if start_date:
                expenses = expenses.filter(date__gte=start_date)
            if end_date:
                expenses = expenses.filter(date__lte=end_date)
            if category:
                expenses = expenses.filter(category=category)

            expenses = expenses.order_by('-date')

            expenses_data = []
            for expense in expenses:
                expenses_data.append({
                    'id': expense.id,
                    'category': expense.category,
                    'description': expense.description,
                    'amount': float(expense.amount),
                    'date': expense.date.isoformat(),
                    'is_necessary': expense.is_necessary,
                    'created_at': expense.created_at.isoformat()
                })

            return Response({
                'expenses': expenses_data,
                'total_count': len(expenses_data),
                'total_amount': sum(e['amount'] for e in expenses_data)
            })

        except Exception as e:
            return Response({
                'error': f'Erreur dépenses: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:  # POST
        try:
            data = request.data

            if not data.get('category'):
                return Response({
                    'error': 'La catégorie est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not data.get('amount'):
                return Response({
                    'error': 'Le montant est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            expense = Expense.objects.create(
                user=user,
                category=data.get('category'),
                description=data.get('description', ''),
                amount=Decimal(data.get('amount')),
                date=data.get('date') if data.get('date') else timezone.now().date(),
                is_necessary=data.get('is_necessary', True)
            )

            update_envelope_spending(user, expense)

            # Recharger depuis la base pour avoir les types corrects
            # (date arrive comme string depuis le front, refresh_from_db la convertit en objet date)
            expense.refresh_from_db()

            return Response({
                'id': expense.id,
                'category': expense.category,
                'description': expense.description,
                'amount': float(expense.amount),
                'date': expense.date.isoformat(),
                'message': 'Dépense créée avec succès'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Erreur création dépense: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, expense_id):
    """Détail, modification et suppression d'une dépense"""
    user = request.user

    try:
        expense = get_object_or_404(Expense, id=expense_id, user=user)

        if request.method == 'GET':
            return Response({
                'id': expense.id,
                'category': expense.category,
                'description': expense.description,
                'amount': float(expense.amount),
                'date': expense.date.isoformat(),
                'is_necessary': expense.is_necessary,
                'created_at': expense.created_at.isoformat()
            })

        elif request.method == 'PUT':
            data = request.data

            if 'category' in data:
                expense.category = data['category']
            if 'description' in data:
                expense.description = data['description']
            if 'amount' in data:
                expense.amount = Decimal(data['amount'])
            if 'date' in data:
                expense.date = data['date']
            if 'is_necessary' in data:
                expense.is_necessary = data['is_necessary']

            expense.save()
            update_all_envelopes(user)
            expense.refresh_from_db()

            return Response({
                'id': expense.id,
                'message': 'Dépense mise à jour'
            })

        elif request.method == 'DELETE':
            expense.delete()
            update_all_envelopes(user)

            return Response({'message': 'Dépense supprimée'})

    except Expense.DoesNotExist:
        return Response({
            'error': 'Dépense introuvable'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# BUDGETS
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_budgets(request):
    """Gestion des budgets par catégorie"""
    user = request.user

    if request.method == 'GET':
        try:
            budgets = Budget.objects.filter(user=user, is_active=True)

            budgets_data = []
            for budget in budgets:
                spent = budget.get_spent_amount()
                budgets_data.append({
                    'id': budget.id,
                    'category': budget.category,
                    'allocated_amount': float(budget.allocated_amount),
                    'spent_amount': float(spent),
                    'remaining_amount': float(budget.remaining_amount),
                    'usage_percentage': round(float(budget.usage_percentage), 1),
                    'period': budget.period,
                    'is_active': budget.is_active,
                    'created_at': budget.created_at.isoformat()
                })

            return Response({
                'budgets': budgets_data,
                'total_allocated': sum(b['allocated_amount'] for b in budgets_data),
                'total_spent': sum(b['spent_amount'] for b in budgets_data)
            })

        except Exception as e:
            return Response({
                'error': f'Erreur budgets: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:  # POST
        try:
            data = request.data

            if not data.get('category'):
                return Response({
                    'error': 'La catégorie est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not data.get('allocated_amount'):
                return Response({
                    'error': 'Le montant alloué est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            budget, created = Budget.objects.update_or_create(
                user=user,
                category=data['category'],
                defaults={
                    'allocated_amount': Decimal(data['allocated_amount']),
                    'period': data.get('period', 'monthly'),
                    'is_active': True
                }
            )

            return Response({
                'id': budget.id,
                'category': budget.category,
                'allocated_amount': float(budget.allocated_amount),
                'message': 'Budget créé avec succès' if created else 'Budget mis à jour'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Erreur création budget: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_overview(request):
    """Vue globale du budget avec comparaison dépenses/budget"""
    user = request.user

    try:
        current_month = timezone.now().replace(day=1)
        budgets = Budget.objects.filter(user=user, is_active=True)

        overview = []
        total_allocated = Decimal(0)
        total_spent = Decimal(0)

        for budget in budgets:
            spent = budget.get_spent_amount()
            total_allocated += budget.allocated_amount
            total_spent += spent

            # Déterminer le statut
            usage = float(budget.usage_percentage)
            if usage <= 70:
                budget_status = 'good'
            elif usage <= 90:
                budget_status = 'warning'
            else:
                budget_status = 'danger'

            overview.append({
                'category': budget.category,
                'allocated_amount': float(budget.allocated_amount),
                'spent_amount': float(spent),
                'remaining_amount': float(budget.remaining_amount),
                'usage_percentage': round(usage, 1),
                'status': budget_status
            })

        # Revenus du mois
        monthly_income = Income.objects.filter(
            user=user, date__gte=current_month
        ).aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'overview': overview,
            'summary': {
                'total_allocated': float(total_allocated),
                'total_spent': float(total_spent),
                'total_remaining': float(total_allocated - total_spent),
                'monthly_income': float(monthly_income),
                'budget_coverage_rate': round(
                    (float(total_allocated) / float(monthly_income) * 100) if monthly_income > 0 else 0, 1
                )
            }
        })

    except Exception as e:
        return Response({
            'error': f'Erreur vue budget: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# OBJECTIFS FINANCIERS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_goals(request):
    """Objectifs financiers pour le dashboard"""
    user = request.user

    try:
        goals = Goal.objects.filter(user=user).order_by('-created_at')
        goals_data = []

        for goal in goals:
            progress = 0
            if goal.target_amount > 0:
                progress = min(round((goal.current_amount / goal.target_amount) * 100, 1), 100)

            goals_data.append({
                'id': goal.id,
                'title': goal.title,
                'target_amount': float(goal.target_amount),
                'current_amount': float(goal.current_amount),
                'progress_percentage': progress,
                'deadline': goal.deadline.isoformat() if goal.deadline else None,
                'category': goal.category,
                'is_achieved': goal.is_achieved,
                'created_at': goal.created_at.isoformat()
            })

        return Response(goals_data)

    except Exception as e:
        return Response({
            'error': f'Erreur objectifs: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_goals(request):
    """Gestion complète des objectifs (GET liste + POST création)"""
    user = request.user

    if request.method == 'GET':
        try:
            goals = Goal.objects.filter(user=user).order_by('-created_at')
            goals_data = []

            for goal in goals:
                progress = 0
                if goal.target_amount > 0:
                    progress = min(round((goal.current_amount / goal.target_amount) * 100, 1), 100)

                goals_data.append({
                    'id': goal.id,
                    'title': goal.title,
                    'description': goal.description,
                    'target_amount': float(goal.target_amount),
                    'current_amount': float(goal.current_amount),
                    'progress_percentage': progress,
                    'deadline': goal.deadline.isoformat() if goal.deadline else None,
                    'category': goal.category,
                    'is_achieved': goal.is_achieved,
                    'created_at': goal.created_at.isoformat(),
                    'updated_at': goal.updated_at.isoformat()
                })

            return Response({
                'goals': goals_data,
                'total_count': len(goals_data),
                'achieved_count': sum(1 for g in goals_data if g['is_achieved']),
                'total_target': sum(g['target_amount'] for g in goals_data),
                'total_current': sum(g['current_amount'] for g in goals_data)
            })

        except Exception as e:
            return Response({
                'error': f'Erreur objectifs: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:  # POST
        try:
            data = request.data

            if not data.get('title'):
                return Response({
                    'error': 'Le titre est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not data.get('target_amount'):
                return Response({
                    'error': 'Le montant cible est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            goal = Goal.objects.create(
                user=user,
                title=data['title'],
                description=data.get('description', ''),
                target_amount=Decimal(data['target_amount']),
                current_amount=Decimal(data.get('current_amount', 0)),
                deadline=data.get('deadline'),
                category=data.get('category', 'autre')
            )

            return Response({
                'id': goal.id,
                'title': goal.title,
                'target_amount': float(goal.target_amount),
                'message': 'Objectif créé avec succès'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Erreur création objectif: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# VALEURS PERSONNELLES
# ==========================================

# ==========================================
# REMPLACE la fonction user_values dans api/views.py (ligne ~878)
# ==========================================

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_values(request):
    """Gestion des valeurs personnelles - Version corrigée"""
    user = request.user

    if request.method == 'GET':
        try:
            values = UserValue.objects.filter(user=user).order_by('priority')
            return Response({
                'values': [{
                    'id': v.id,
                    'value': v.value,
                    'priority': v.priority,
                    'selected_at': v.selected_at.isoformat()
                } for v in values]
            })
        except Exception as e:
            return Response({
                'error': f'Erreur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            value = request.data.get('value')
            priority = request.data.get('priority')

            if not value or not priority:
                return Response({
                    'error': 'value et priority requis'
                }, status=status.HTTP_400_BAD_REQUEST)

            # ✅ UPDATE_OR_CREATE au lieu de vérifier l'existence
            user_value, created = UserValue.objects.update_or_create(
                user=user,
                value=value,
                defaults={'priority': int(priority)}
            )

            return Response({
                'id': user_value.id,
                'value': user_value.value,
                'priority': user_value.priority,
                'created': created
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Erreur: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            # ✅ Supprimer TOUTES les valeurs de l'user
            deleted_count, _ = UserValue.objects.filter(user=user).delete()
            return Response({
                'message': f'{deleted_count} valeur(s) supprimée(s)'
            })
        except Exception as e:
            return Response({
                'error': f'Erreur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# SYSTÈME DES 3 ENVELOPPES
# ==========================================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def manage_envelopes(request):
    """Gestion des 3 enveloppes budgétaires"""
    user = request.user

    if request.method == 'GET':
        try:
            create_default_envelopes(user)

            envelopes = Envelope.objects.filter(user=user, is_active=True).order_by('envelope_type')
            current_month = timezone.now().replace(day=1)

            envelopes_data = []
            for envelope in envelopes:
                categories = get_categories_for_envelope(envelope.envelope_type)
                month_expenses = Expense.objects.filter(
                    user=user,
                    category__in=categories,
                    date__gte=current_month
                ).aggregate(total=Sum('amount'))['total'] or 0

                envelope.current_spent = month_expenses
                envelope.save()

                envelopes_data.append({
                    'id': envelope.id,
                    'envelope_type': envelope.envelope_type,
                    'allocated_percentage': float(envelope.allocated_percentage),
                    'monthly_budget': float(envelope.monthly_budget),
                    'current_spent': float(envelope.current_spent),
                    'remaining_budget': float(envelope.remaining_budget),
                    'usage_percentage': round(envelope.usage_percentage, 1),
                    'status': envelope.status
                })

            return Response(envelopes_data)

        except Exception as e:
            return Response({
                'error': f'Erreur récupération enveloppes: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            data = request.data
            monthly_income = Decimal(data.get('monthly_income', 0))

            if monthly_income <= 0:
                return Response({
                    'error': 'Revenu mensuel requis pour configurer les enveloppes'
                }, status=status.HTTP_400_BAD_REQUEST)

            envelope_configs = [
                ('essentiels', 50),
                ('plaisirs', 30),
                ('projets', 20)
            ]

            for envelope_type, default_percentage in envelope_configs:
                custom_percentage = data.get(f'{envelope_type}_percentage', default_percentage)
                monthly_budget = (Decimal(str(custom_percentage)) / 100) * monthly_income

                Envelope.objects.update_or_create(
                    user=user,
                    envelope_type=envelope_type,
                    defaults={
                        'allocated_percentage': custom_percentage,
                        'monthly_budget': monthly_budget
                    }
                )

            user.profile.monthly_income = monthly_income
            user.profile.save()

            return Response({
                'message': 'Enveloppes configurées avec succès',
                'monthly_income': float(monthly_income)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Erreur configuration: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PUT':
        try:
            data = request.data

            total_percentage = 0
            for envelope_type in ['essentiels', 'plaisirs', 'projets']:
                percentage = data.get(f'{envelope_type}_percentage', 0)
                total_percentage += float(percentage)

            if abs(total_percentage - 100) > 0.1:
                return Response({
                    'error': f'Les pourcentages doivent totaliser 100% (actuellement: {total_percentage}%)'
                }, status=status.HTTP_400_BAD_REQUEST)

            monthly_income = user.profile.monthly_income

            for envelope_type in ['essentiels', 'plaisirs', 'projets']:
                percentage = data.get(f'{envelope_type}_percentage')
                if percentage is not None:
                    envelope = Envelope.objects.get(user=user, envelope_type=envelope_type)
                    envelope.allocated_percentage = Decimal(str(percentage))
                    envelope.monthly_budget = (Decimal(str(percentage)) / 100) * monthly_income
                    envelope.save()

            return Response({'message': 'Enveloppes mises à jour'})

        except Envelope.DoesNotExist:
            return Response({
                'error': 'Enveloppe introuvable'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erreur mise à jour: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def envelope_analysis(request):
    """Analyse détaillée des enveloppes avec recommandations"""
    user = request.user

    try:
        create_default_envelopes(user)
        envelopes = Envelope.objects.filter(user=user, is_active=True)
        current_month = timezone.now().replace(day=1)

        analysis = []
        recommendations = []

        for envelope in envelopes:
            categories = get_categories_for_envelope(envelope.envelope_type)

            # Dépenses du mois par catégorie dans cette enveloppe
            category_breakdown = []
            for category in categories:
                cat_total = Expense.objects.filter(
                    user=user,
                    category=category,
                    date__gte=current_month
                ).aggregate(total=Sum('amount'))['total'] or 0

                if cat_total > 0:
                    category_breakdown.append({
                        'category': category,
                        'amount': float(cat_total),
                        'percentage_of_envelope': round(
                            (float(cat_total) / float(
                                envelope.monthly_budget) * 100) if envelope.monthly_budget > 0 else 0,
                            1
                        )
                    })

            usage = envelope.usage_percentage
            analysis.append({
                'envelope_type': envelope.envelope_type,
                'monthly_budget': float(envelope.monthly_budget),
                'current_spent': float(envelope.current_spent),
                'remaining_budget': float(envelope.remaining_budget),
                'usage_percentage': round(usage, 1),
                'status': envelope.status,
                'category_breakdown': category_breakdown
            })

            # Générer des recommandations
            if usage > 90:
                recommendations.append(
                    f"⚠️ Enveloppe '{envelope.envelope_type}' : vous avez dépassé 90% de votre budget. Réduisez vos dépenses dans cette catégorie."
                )
            elif usage > 70:
                recommendations.append(
                    f"📊 Enveloppe '{envelope.envelope_type}' : vous approchez de votre limite (70%). Soyez prudent."
                )

        if not recommendations:
            recommendations.append("✅ Toutes vos enveloppes sont bien gérées !")

        return Response({
            'analysis': analysis,
            'recommendations': recommendations
        })

    except Exception as e:
        return Response({
            'error': f'Erreur analyse enveloppes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_monthly_envelopes(request):
    """Remettre à zéro les enveloppes pour le nouveau mois"""
    user = request.user

    try:
        envelopes = Envelope.objects.filter(user=user, is_active=True)

        for envelope in envelopes:
            envelope.current_spent = 0
            envelope.save()

        return Response({
            'message': 'Enveloppes réinitialisées pour le nouveau mois'
        })

    except Exception as e:
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# TONTINES
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_tontines(request):
    """Tontines actives de l'utilisateur"""
    user = request.user

    try:
        user_tontines = Tontine.objects.filter(
            Q(creator=user) | Q(participants__user=user)
        ).filter(
            status__in=['planning', 'active']
        ).distinct().order_by('-created_at')

        tontines_data = []
        for tontine in user_tontines:
            tontines_data.append({
                'id': tontine.id,
                'name': tontine.name,
                'total_amount': float(tontine.total_amount),
                'monthly_contribution': float(tontine.monthly_contribution),
                'current_participants': tontine.participants.count(),
                'max_participants': tontine.max_participants,
                'status': tontine.status,
                'progress_percentage': round(tontine.progress_percentage, 1),
                'available_spots': tontine.available_spots,
                'next_payment_date': tontine.next_payment_date().isoformat() if tontine.next_payment_date() else None,
                'created_at': tontine.created_at.isoformat()
            })

        return Response(tontines_data)

    except Exception as e:
        return Response({
            'error': f'Erreur tontines actives: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_tontines(request):
    """Gestion des tontines"""
    user = request.user

    if request.method == 'GET':
        try:
            tontines = Tontine.objects.filter(
                Q(creator=user) | Q(participants__user=user)
            ).distinct()

            tontines_data = []
            for tontine in tontines:
                tontines_data.append({
                    'id': tontine.id,
                    'name': tontine.name,
                    'description': tontine.description,
                    'total_amount': float(tontine.total_amount),
                    'monthly_contribution': float(tontine.monthly_contribution),
                    'max_participants': tontine.max_participants,
                    'current_participants': tontine.participants.count(),
                    'available_spots': tontine.available_spots,
                    'status': tontine.status,
                    'invitation_code': tontine.invitation_code,
                    'start_date': tontine.start_date.isoformat() if tontine.start_date else None,
                    'end_date': tontine.end_date.isoformat() if tontine.end_date else None,
                    'created_at': tontine.created_at.isoformat(),
                    'creator': {
                        'id': tontine.creator.id,
                        'username': tontine.creator.username,
                        'first_name': tontine.creator.first_name,
                        'last_name': tontine.creator.last_name
                    }
                })

            return Response(tontines_data)

        except Exception as e:
            return Response({
                'error': f'Erreur récupération tontines: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:  # POST
        try:
            data = request.data
            required_fields = ['name', 'total_amount', 'monthly_contribution', 'max_participants', 'duration_months',
                               'start_date']

            for field in required_fields:
                if not data.get(field):
                    return Response({
                        'error': f'Le champ {field} est obligatoire'
                    }, status=status.HTTP_400_BAD_REQUEST)

            from dateutil.relativedelta import relativedelta
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = start_date + relativedelta(months=int(data['duration_months']))

            tontine = Tontine.objects.create(
                name=data['name'],
                description=data.get('description', ''),
                creator=user,
                total_amount=Decimal(data['total_amount']),
                monthly_contribution=Decimal(data['monthly_contribution']),
                max_participants=int(data['max_participants']),
                duration_months=int(data['duration_months']),
                frequency=data.get('frequency', 'monthly'),
                start_date=start_date,
                end_date=end_date,
                rules=data.get('rules', ''),
                is_private=data.get('is_private', False)
            )

            # Le créateur devient automatiquement participant admin
            TontineParticipant.objects.create(
                tontine=tontine,
                user=user,
                position=1,
                is_admin=True
            )

            return Response({
                'id': tontine.id,
                'invitation_code': tontine.invitation_code,
                'message': 'Tontine créée avec succès'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Erreur création tontine: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tontine_detail(request, tontine_id):
    """Gestion détaillée d'une tontine"""
    try:
        tontine = get_object_or_404(Tontine, id=tontine_id, creator=request.user)

        if request.method == 'GET':
            participants = TontineParticipant.objects.filter(tontine=tontine).order_by('position')
            participants_data = []

            for participant in participants:
                participants_data.append({
                    'id': participant.id,
                    'user': {
                        'id': participant.user.id,
                        'username': participant.user.username,
                        'first_name': participant.user.first_name,
                        'last_name': participant.user.last_name
                    },
                    'position': participant.position,
                    'is_admin': participant.is_admin,
                    'is_active': participant.is_active,
                    'received_payout': participant.received_payout,
                    'total_contributions': float(participant.total_contributions),
                    'contribution_status': participant.contribution_status,
                    'joined_at': participant.joined_at.isoformat()
                })

            return Response({
                'id': tontine.id,
                'name': tontine.name,
                'description': tontine.description,
                'total_amount': float(tontine.total_amount),
                'monthly_contribution': float(tontine.monthly_contribution),
                'max_participants': tontine.max_participants,
                'current_participants': tontine.participants.count(),
                'available_spots': tontine.available_spots,
                'status': tontine.status,
                'invitation_code': tontine.invitation_code,
                'start_date': tontine.start_date.isoformat() if tontine.start_date else None,
                'end_date': tontine.end_date.isoformat() if tontine.end_date else None,
                'duration_months': tontine.duration_months,
                'frequency': tontine.frequency,
                'rules': tontine.rules,
                'is_private': tontine.is_private,
                'progress_percentage': round(tontine.progress_percentage, 1),
                'total_contributions_received': float(tontine.total_contributions_received()),
                'created_at': tontine.created_at.isoformat(),
                'participants': participants_data,
                'creator': {
                    'id': tontine.creator.id,
                    'username': tontine.creator.username,
                    'first_name': tontine.creator.first_name,
                    'last_name': tontine.creator.last_name
                }
            })

        elif request.method == 'PATCH':
            data = request.data

            if tontine.creator != request.user:
                return Response(
                    {'error': 'Seul le créateur peut modifier cette tontine'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if 'name' in data:
                tontine.name = data['name']
            if 'description' in data:
                tontine.description = data['description']

            # Ces champs ne sont modifiables que si personne d'autre ne s'est encore inscrit
            if tontine.participants.count() <= 1:
                if 'monthly_contribution' in data:
                    tontine.monthly_contribution = Decimal(data['monthly_contribution'])
                if 'max_participants' in data:
                    tontine.max_participants = int(data['max_participants'])
                if 'total_amount' in data:
                    tontine.total_amount = Decimal(data['total_amount'])

            tontine.save()

            return Response({
                'id': tontine.id,
                'message': 'Tontine modifiée avec succès'
            })

        elif request.method == 'DELETE':
            if tontine.creator != request.user:
                return Response(
                    {'error': 'Seul le créateur peut supprimer cette tontine'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if tontine.status != 'planning':
                return Response(
                    {'error': 'Seules les tontines en planification peuvent être supprimées'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            has_contributions = TontineContribution.objects.filter(participant__tontine=tontine).exists()
            if has_contributions:
                return Response(
                    {'error': 'Impossible de supprimer une tontine avec des contributions'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            TontineParticipant.objects.filter(tontine=tontine).delete()
            tontine_name = tontine.name
            tontine.delete()

            return Response({
                'message': f'Tontine "{tontine_name}" supprimée avec succès'
            })

    except Tontine.DoesNotExist:
        return Response(
            {'error': 'Tontine introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_tontine(request):
    """Rejoindre une tontine via un code d'invitation"""
    user = request.user

    try:
        data = request.data
        invitation_code = data.get('invitation_code')

        if not invitation_code:
            return Response({
                'error': 'Le code d\'invitation est obligatoire'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Trouver la tontine par le code
        try:
            tontine = Tontine.objects.get(invitation_code=invitation_code)
        except Tontine.DoesNotExist:
            return Response({
                'error': 'Code d\'invitation invalide'
            }, status=status.HTTP_404_NOT_FOUND)

        # Vérifier que la tontine est en planification ou active
        if tontine.status not in ['planning', 'active']:
            return Response({
                'error': 'Cette tontine n\'accepte plus de participants'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier qu'il reste des places
        if tontine.available_spots <= 0:
            return Response({
                'error': 'La tontine est complète'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'utilisateur n'est pas déjà participant
        if TontineParticipant.objects.filter(tontine=tontine, user=user).exists():
            return Response({
                'error': 'Vous êtes déjà participant à cette tontine'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Créer la participation (la position est assignée automatiquement par le signal)
        participant = TontineParticipant.objects.create(
            tontine=tontine,
            user=user,
            position=0,  # sera mis à jour par le signal
            is_admin=False
        )

        return Response({
            'id': participant.id,
            'tontine': {
                'id': tontine.id,
                'name': tontine.name
            },
            'position': participant.position,
            'message': f'Vous avez rejoint la tontine "{tontine.name}" avec succès'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_tontine(request, tontine_id):
    """Activer une tontine (passer de planning à active)"""
    user = request.user

    try:
        tontine = get_object_or_404(Tontine, id=tontine_id, creator=user)

        if tontine.status != 'planning':
            return Response({
                'error': 'Seules les tontines en planification peuvent être activées'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier qu'il y a au moins 2 participants
        if tontine.participants.count() < 2:
            return Response({
                'error': 'Au moins 2 participants sont nécessaires pour activer une tontine'
            }, status=status.HTTP_400_BAD_REQUEST)

        tontine.status = 'active'
        tontine.save()

        return Response({
            'id': tontine.id,
            'status': tontine.status,
            'message': 'Tontine activée avec succès'
        })

    except Exception as e:
        return Response({
            'error': f'Erreur activation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_contribution(request, tontine_id):
    """Effectuer une contribution à une tontine"""
    user = request.user

    try:
        tontine = get_object_or_404(Tontine, id=tontine_id)

        # Vérifier que l'utilisateur est participant
        try:
            participant = TontineParticipant.objects.get(tontine=tontine, user=user)
        except TontineParticipant.DoesNotExist:
            return Response({
                'error': 'Vous n\'êtes pas participant à cette tontine'
            }, status=status.HTTP_403_FORBIDDEN)

        # Vérifier que la tontine est active
        if tontine.status != 'active':
            return Response({
                'error': 'La tontine doit être active pour effectuer une contribution'
            }, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        amount = data.get('amount')

        if not amount:
            return Response({
                'error': 'Le montant est obligatoire'
            }, status=status.HTTP_400_BAD_REQUEST)

        contribution = TontineContribution.objects.create(
            participant=participant,
            amount=Decimal(amount),
            date=data.get('date') if data.get('date') else timezone.now().date(),
            payment_method=data.get('payment_method', 'virement'),
            transaction_reference=data.get('transaction_reference', ''),
            notes=data.get('notes', ''),
            is_validated=False
        )

        return Response({
            'id': contribution.id,
            'amount': float(contribution.amount),
            'date': contribution.date.isoformat(),
            'is_validated': contribution.is_validated,
            'message': 'Contribution enregistrée avec succès. Elle sera validée par l\'administrateur.'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': f'Erreur contribution: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tontine_participants(request, tontine_id):
    """Gestion des participants d'une tontine"""
    user = request.user

    try:
        tontine = get_object_or_404(Tontine, id=tontine_id)

        # Vérifier que l'utilisateur est admin ou créateur
        is_admin = TontineParticipant.objects.filter(
            tontine=tontine, user=user, is_admin=True
        ).exists() or tontine.creator == user

        if request.method == 'GET':
            participants = TontineParticipant.objects.filter(tontine=tontine).order_by('position')
            participants_data = []

            for participant in participants:
                participants_data.append({
                    'id': participant.id,
                    'user': {
                        'id': participant.user.id,
                        'username': participant.user.username,
                        'first_name': participant.user.first_name,
                        'last_name': participant.user.last_name
                    },
                    'position': participant.position,
                    'is_admin': participant.is_admin,
                    'is_active': participant.is_active,
                    'received_payout': participant.received_payout,
                    'total_contributions': float(participant.total_contributions),
                    'contribution_status': participant.contribution_status,
                    'joined_at': participant.joined_at.isoformat()
                })

            return Response({
                'participants': participants_data,
                'total_count': len(participants_data),
                'available_spots': tontine.available_spots
            })

        else:  # POST - Valider/désactiver un participant (admin seulement)
            if not is_admin:
                return Response({
                    'error': 'Seul l\'administrateur peut gérer les participants'
                }, status=status.HTTP_403_FORBIDDEN)

            data = request.data
            participant_id = data.get('participant_id')
            action = data.get('action')  # 'deactivate' ou 'validate_contribution'

            if not participant_id or not action:
                return Response({
                    'error': 'participant_id et action sont obligatoires'
                }, status=status.HTTP_400_BAD_REQUEST)

            participant = get_object_or_404(TontineParticipant, id=participant_id, tontine=tontine)

            if action == 'deactivate':
                participant.is_active = False
                participant.save()
                return Response({'message': f'Participant {participant.user.username} désactivé'})

            elif action == 'validate_contribution':
                contribution_id = data.get('contribution_id')
                if not contribution_id:
                    return Response({
                        'error': 'contribution_id est obligatoire pour valider'
                    }, status=status.HTTP_400_BAD_REQUEST)

                contribution = get_object_or_404(TontineContribution, id=contribution_id, participant=participant)
                contribution.is_validated = True
                contribution.validated_by = user
                contribution.validated_at = timezone.now()
                contribution.save()

                return Response({'message': 'Contribution validée avec succès'})

            else:
                return Response({
                    'error': 'Action non reconnue'
                }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Erreur participants: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_positions(request, tontine_id):
    """Mettre à jour les positions des participants"""
    user = request.user

    try:
        tontine = get_object_or_404(Tontine, id=tontine_id, creator=user)

        # Seul le créateur peut modifier les positions
        if tontine.creator != user:
            return Response(
                {'error': 'Seul le créateur peut modifier les positions'},
                status=status.HTTP_403_FORBIDDEN
            )

        # La tontine doit être en planification pour changer les positions
        if tontine.status != 'planning':
            return Response(
                {'error': 'Les positions ne peuvent être modifiées qu\'en planification'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        positions = data.get('positions', [])  # Liste de {'participant_id': X, 'position': Y}

        if not positions:
            return Response({
                'error': 'La liste des positions est obligatoire'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Valider que toutes les positions sont cohérentes
        position_values = [p.get('position') for p in positions]
        if len(set(position_values)) != len(position_values):
            return Response({
                'error': 'Les positions doivent être uniques'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mettre à jour les positions
        for pos_data in positions:
            participant = get_object_or_404(
                TontineParticipant,
                id=pos_data['participant_id'],
                tontine=tontine
            )
            participant.position = pos_data['position']
            participant.save()

        return Response({
            'message': 'Positions mises à jour avec succès'
        })

    except Exception as e:
        return Response({
            'error': f'Erreur mise à jour positions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# DIAGNOSTIC FINANCIER
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_diagnostic(request):
    """Sauvegarder les résultats d'un diagnostic financier"""
    user = request.user

    try:
        data = request.data

        required_fields = ['financial_health_score', 'savings_capacity_score',
                           'planning_score', 'risk_management_score', 'overall_score']

        for field in required_fields:
            if field not in data:
                return Response({
                    'error': f'Le champ {field} est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

        diagnostic = DiagnosticResult.objects.create(
            user=user,
            financial_health_score=int(data['financial_health_score']),
            savings_capacity_score=int(data['savings_capacity_score']),
            planning_score=int(data['planning_score']),
            risk_management_score=int(data['risk_management_score']),
            overall_score=int(data['overall_score']),
            recommendations=data.get('recommendations', {})
        )

        return Response({
            'id': diagnostic.id,
            'overall_score': diagnostic.overall_score,
            'completed_at': diagnostic.completed_at.isoformat(),
            'message': 'Diagnostic sauvegardé avec succès'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': f'Erreur sauvegarde diagnostic: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_diagnostic_history(request):
    """Historique des diagnostics financiers"""
    user = request.user

    try:
        diagnostics = DiagnosticResult.objects.filter(user=user).order_by('-completed_at')
        limit = int(request.GET.get('limit', 10))

        diagnostics_data = []
        for diag in diagnostics[:limit]:
            diagnostics_data.append({
                'id': diag.id,
                'financial_health_score': diag.financial_health_score,
                'savings_capacity_score': diag.savings_capacity_score,
                'planning_score': diag.planning_score,
                'risk_management_score': diag.risk_management_score,
                'overall_score': diag.overall_score,
                'recommendations': diag.recommendations,
                'completed_at': diag.completed_at.isoformat()
            })

        # Calculer la tendance si plusieurs diagnostics
        trend = None
        if len(diagnostics_data) >= 2:
            latest = diagnostics_data[0]['overall_score']
            previous = diagnostics_data[1]['overall_score']
            if latest > previous:
                trend = 'up'
            elif latest < previous:
                trend = 'down'
            else:
                trend = 'stable'

        return Response({
            'diagnostics': diagnostics_data,
            'total_count': len(diagnostics_data),
            'trend': trend
        })

    except Exception as e:
        return Response({
            'error': f'Erreur historique diagnostic: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# FUITES FINANCIÈRES
# ==========================================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def manage_financial_leaks(request):
    """Gestion des fuites financières"""
    user = request.user

    if request.method == 'GET':
        try:
            leaks = FinancialLeak.objects.filter(user=user).order_by('-identified_at')
            filter_status = request.GET.get('status')  # 'active', 'plugged', 'all'

            if filter_status == 'active':
                leaks = leaks.filter(is_plugged=False)
            elif filter_status == 'plugged':
                leaks = leaks.filter(is_plugged=True)

            leaks_data = []
            for leak in leaks:
                leaks_data.append({
                    'id': leak.id,
                    'category': leak.category,
                    'description': leak.description,
                    'daily_amount': float(leak.daily_amount),
                    'monthly_impact': float(leak.monthly_impact),
                    'annual_impact': float(leak.annual_impact),
                    'is_plugged': leak.is_plugged,
                    'identified_at': leak.identified_at.isoformat(),
                    'plugged_at': leak.plugged_at.isoformat() if leak.plugged_at else None
                })

            # Résumé
            total_monthly_impact_active = sum(
                l['monthly_impact'] for l in leaks_data if not l['is_plugged']
            )
            total_annual_impact_active = sum(
                l['annual_impact'] for l in leaks_data if not l['is_plugged']
            )
            total_plugged = sum(1 for l in leaks_data if l['is_plugged'])

            return Response({
                'leaks': leaks_data,
                'summary': {
                    'total_leaks': len(leaks_data),
                    'active_leaks': len(leaks_data) - total_plugged,
                    'plugged_leaks': total_plugged,
                    'total_monthly_impact_active': round(total_monthly_impact_active, 2),
                    'total_annual_impact_active': round(total_annual_impact_active, 2)
                }
            })

        except Exception as e:
            return Response({
                'error': f'Erreur fuites financières: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            data = request.data

            if not data.get('category'):
                return Response({
                    'error': 'La catégorie est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not data.get('description'):
                return Response({
                    'error': 'La description est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not data.get('daily_amount'):
                return Response({
                    'error': 'Le montant quotidien est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            leak = FinancialLeak.objects.create(
                user=user,
                category=data['category'],
                description=data['description'],
                daily_amount=Decimal(data['daily_amount'])
                # monthly_impact et annual_impact sont calculés automatiquement dans save()
            )

            return Response({
                'id': leak.id,
                'category': leak.category,
                'description': leak.description,
                'daily_amount': float(leak.daily_amount),
                'monthly_impact': float(leak.monthly_impact),
                'annual_impact': float(leak.annual_impact),
                'message': 'Fuite financière identifiée avec succès'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Erreur création fuite: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    else:  # PUT - Colmater une fuite
        try:
            data = request.data
            leak_id = data.get('id')

            if not leak_id:
                return Response({
                    'error': 'L\'ID de la fuite est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)

            leak = get_object_or_404(FinancialLeak, id=leak_id, user=user)

            if leak.is_plugged:
                return Response({
                    'error': 'Cette fuite est déjà colmatée'
                }, status=status.HTTP_400_BAD_REQUEST)

            leak.is_plugged = True
            leak.plugged_at = timezone.now()
            leak.save()

            return Response({
                'id': leak.id,
                'is_plugged': True,
                'plugged_at': leak.plugged_at.isoformat(),
                'message': f'Fuite "{leak.description}" colmatée avec succès ! Économie annuelle : {float(leak.annual_impact)} FCFA'
            })

        except Exception as e:
            return Response({
                'error': f'Erreur colmatage fuite: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# IA CHAT - YOONU ASSISTANT
# ==========================================

# api/views.py - REMPLACER la fonction ai_chat existante par celle-ci
# api/views.py - REMPLACER la fonction ai_chat existante par celle-ci

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import anthropic
import json
from datetime import datetime
from django.db.models import Sum



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@check_usage_limit('ai_messages_count', 50, "Messages IA")
def ai_chat(request):
    """Chat IA avec actions intelligentes (dépenses, revenus, TONTINES)"""
    user = request.user

    try:
        # ✅ FIX: Vérifier que la clé API existe
        from django.conf import settings
        
        api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        if not api_key:
            logger.error("ANTHROPIC_API_KEY non configurée")
            return Response({
                'error': 'Service IA temporairement indisponible',
                'message': 'Désolé, j\'ai un problème technique. Réessayez plus tard.',
                'actions': []
            }, status=500)

        message = request.data.get('message', '')
        history = request.data.get('conversation_history', [])

        if not message:
            return Response({'error': 'Message requis'}, status=status.HTTP_400_BAD_REQUEST)

        # Contexte financier
        now = datetime.now()
        start_of_month = now.replace(day=1)

        monthly_expenses = Expense.objects.filter(
            user=user, date__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0

        monthly_income = Income.objects.filter(
            user=user, date__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0

        envelopes = Envelope.objects.filter(user=user)
        envelopes_data = [{
            'type': env.envelope_type,
            'budget': float(env.monthly_budget),
            'spent': float(env.current_spent),
            'remaining': float(env.monthly_budget - env.current_spent)
        } for env in envelopes]

        recent_expenses = Expense.objects.filter(user=user).order_by('-date')[:5]
        recent_expenses_data = [{
            'category': exp.category,
            'amount': float(exp.amount),
            'description': exp.description,
            'date': exp.date.isoformat()
        } for exp in recent_expenses]

        # Contexte tontines
        my_tontines = Tontine.objects.filter(
            Q(creator=user) | Q(participants__user=user)
        ).distinct()

        tontines_data = []
        for tontine in my_tontines:
            participants_count = tontine.participants.count()
            my_participation = tontine.participants.filter(user=user).first()

            tontines_data.append({
                'id': tontine.id,
                'name': tontine.name,
                'monthly_contribution': float(tontine.monthly_contribution),
                'total_amount': float(tontine.total_amount),
                'frequency': tontine.frequency,
                'participants': participants_count,
                'max_participants': tontine.max_participants,
                'status': tontine.status,
                'my_position': my_participation.position if my_participation else None
            })

        user_context = {
            'name': user.username,
            'monthly_income': float(monthly_income),
            'monthly_expenses': float(monthly_expenses),
            'balance': float(monthly_income - monthly_expenses),
            'envelopes': envelopes_data,
            'recent_expenses': recent_expenses_data,
            'tontines': tontines_data
        }

        # System prompt avec tontines
        system_prompt = f"""Tu es Yoonu, l'assistant financier personnel de {user.username}.

CONTEXTE : Sénégal, FCFA, Tontines, solidarité familiale

DONNÉES :
{json.dumps(user_context, indent=2, ensure_ascii=False)}

ACTIONS DISPONIBLES :
1. create_expense - Créer dépense
2. create_income - Créer revenu  
3. create_tontine - Créer tontine (name, contribution_amount, frequency, total_participants)
4. list_tontines - Afficher tontines (pas de bouton)

FORMAT JSON STRICT :
{{
  "message": "Ta réponse conversationnelle",
  "actions": [
    {{
      "type": "create_tontine",
      "label": "✅ Créer la tontine",
      "data": {{
        "name": "Projet Commerce",
        "contribution_amount": 50000,
        "frequency": "monthly",
        "total_participants": 10
      }}
    }}
  ]
}}

Si pas d'action : "actions": []

RÈGLES : Bref (2-3 phrases), JSON valide obligatoire, conversationnel
"""

        # ✅ FIX: Appel API avec gestion d'erreur détaillée
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)

            messages = []
            for msg in history[-10:]:
                messages.append({'role': msg['role'], 'content': msg['content']})

            messages.append({'role': 'user', 'content': message})

            response = client.messages.create(
                model='claude-sonnet-4-20250514',
                max_tokens=800,
                system=system_prompt,
                messages=messages
            )

            assistant_message = response.content[0].text

        except ImportError:
            logger.error("Module anthropic non installé")
            return Response({
                'error': 'Module IA manquant',
                'message': 'Désolé, j\'ai un problème technique.',
                'actions': []
            }, status=500)
            
        except Exception as api_error:
            logger.error(f"❌ Erreur API Anthropic: {api_error}", exc_info=True)
            return Response({
                'error': f'Erreur API: {str(api_error)}',
                'message': 'Désolé, j\'ai un problème technique. Réessayez plus tard.',
                'actions': []
            }, status=500)

        # Parser JSON (version améliorée)
        try:
            cleaned = assistant_message.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            # Chercher le premier { et prendre jusqu'au dernier }
            start = cleaned.find('{')
            end = cleaned.rfind('}')
            if start != -1 and end != -1:
                cleaned = cleaned[start:end + 1]

            parsed = json.loads(cleaned)

            return Response({
                'message': parsed.get('message', assistant_message),
                'actions': parsed.get('actions', []),
                'context_used': user_context
            })

        except json.JSONDecodeError as json_err:
            logger.warning(f"JSON invalide de Claude: {json_err}")
            return Response({
                'message': assistant_message,
                'actions': [],
                'context_used': user_context
            })

    except Exception as e:
        logger.error(f"❌ Erreur ai_chat globale: {e}", exc_info=True)
        return Response({
            'error': f'Erreur IA: {str(e)}',
            'message': 'Désolé, j\'ai un problème technique.',
            'actions': []
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_execute_action(request):
    """Exécute une action IA (dépenses, revenus, TONTINES)"""
    user = request.user

    try:
        action_type = request.data.get('action_type')
        data = request.data.get('data', {})

        if not action_type:
            return Response({'error': 'Type requis'}, status=status.HTTP_400_BAD_REQUEST)

        # DÉPENSE
        if action_type == 'create_expense':
            expense = Expense.objects.create(
                user=user,
                category=data.get('category', 'autre'),
                description=data.get('description', ''),
                amount=data.get('amount', 0),
                date=data.get('date', datetime.now().date()),
                is_necessary=True
            )
            expense.refresh_from_db()
            update_envelope_spending(user, expense)

            return Response({
                'success': True,
                'message': f'Dépense de {data.get("amount")} FCFA ajoutée !',
                'expense_id': expense.id
            })

        # REVENU
        elif action_type == 'create_income':
            income = Income.objects.create(
                user=user,
                source=data.get('source', 'Autre'),
                amount=data.get('amount', 0),
                date=data.get('date', datetime.now().date())
            )

            return Response({
                'success': True,
                'message': f'Revenu de {data.get("amount")} FCFA ajouté !',
                'income_id': income.id
            })

        # CRÉER TONTINE (AVEC LES BONS NOMS DE CHAMPS)
        elif action_type == 'create_tontine':
            from datetime import timedelta

            # Frontend envoie 'contribution_amount' et 'total_participants'
            monthly_contribution = data.get('contribution_amount', 0)
            max_participants = data.get('total_participants', 5)

            # Calculer les champs requis
            start_date = timezone.now().date()
            duration_months = max_participants  # 1 tour par mois
            end_date = start_date + timedelta(days=30 * duration_months)
            total_amount = monthly_contribution * max_participants

            tontine = Tontine.objects.create(
                creator=user,
                name=data.get('name', 'Ma Tontine'),
                monthly_contribution=monthly_contribution,
                max_participants=max_participants,
                total_amount=total_amount,
                duration_months=duration_months,
                frequency=data.get('frequency', 'monthly'),
                start_date=start_date,
                end_date=end_date,
                status='planning'  # En planification jusqu'à activation
            )

            # Créateur = premier participant
            TontineParticipant.objects.create(
                tontine=tontine,
                user=user,
                position=1,
                payout_position=1,
                is_admin=True
            )

            return Response({
                'success': True,
                'message': f'🎉 Tontine "{tontine.name}" créée ! {max_participants} membres × {monthly_contribution} FCFA = {total_amount} FCFA. Invite tes amis pour l\'activer !',
                'tontine_id': tontine.id
            })

        else:
            return Response({'error': f'Action inconnue: {action_type}'}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': f'Erreur: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# api/views.py - AJOUTER CES FONCTIONS À LA FIN

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Avg, Count
from decimal import Decimal


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_predictions(request):
    """
    Génère et retourne les alertes prédictives pour l'utilisateur

    Cette fonction :
    1. Analyse les dépenses du mois en cours
    2. Détecte les risques de dépassement budget
    3. Vérifie les échéances à venir
    4. Génère des alertes
    """
    user = request.user

    try:
        # Nettoyer les anciennes alertes (> 7 jours)
        old_date = timezone.now() - timedelta(days=7)
        PredictiveAlert.objects.filter(user=user, created_at__lt=old_date).delete()

        alerts_created = []

        # ========== 1. ALERTES BUDGÉTAIRES ==========
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        days_in_month = 30  # Simplifié
        days_elapsed = (now - start_of_month).days + 1
        days_remaining = days_in_month - days_elapsed

        envelopes = Envelope.objects.filter(user=user)

        for envelope in envelopes:
            budget = float(envelope.monthly_budget)
            spent = float(envelope.current_spent)

            if budget == 0:
                continue

            percent_spent = (spent / budget) * 100
            percent_time_elapsed = (days_elapsed / days_in_month) * 100

            # Projection : si on continue au même rythme
            if days_elapsed > 0:
                daily_rate = spent / days_elapsed
                projected_total = daily_rate * days_in_month
                projected_overspend = projected_total - budget
            else:
                projected_overspend = 0

            # ALERTE CRITIQUE : Déjà dépassé
            if spent > budget:
                overspend = spent - budget
                alert, created = PredictiveAlert.objects.get_or_create(
                    user=user,
                    alert_type='budget_warning',
                    title=f"Budget {envelope.envelope_type} dépassé !",
                    defaults={
                        'severity': 'critical',
                        'message': f"Tu as déjà dépensé {spent:,.0f} FCFA sur un budget de {budget:,.0f} FCFA. Dépassement de {overspend:,.0f} FCFA.",
                        'suggested_action': {
                            'type': 'freeze_category',
                            'envelope': envelope.envelope_type,
                            'message': 'Bloquer les nouvelles dépenses ?'
                        },
                        'context': {
                            'envelope': envelope.envelope_type,
                            'budget': budget,
                            'spent': spent,
                            'overspend': overspend,
                            'days_remaining': days_remaining
                        }
                    }
                )
                if created:
                    alerts_created.append(alert)

            # ALERTE WARNING : Va dépasser
            elif projected_overspend > 0 and percent_spent > 70:
                alert, created = PredictiveAlert.objects.get_or_create(
                    user=user,
                    alert_type='budget_warning',
                    title=f"Risque de dépassement {envelope.envelope_type}",
                    defaults={
                        'severity': 'warning',
                        'message': f"Tu as dépensé {spent:,.0f} FCFA ({percent_spent:.0f}% du budget). À ce rythme, tu dépasseras de {projected_overspend:,.0f} FCFA avant la fin du mois.",
                        'suggested_action': {
                            'type': 'reduce_spending',
                            'envelope': envelope.envelope_type,
                            'daily_limit': (budget - spent) / max(days_remaining, 1),
                            'message': 'Activer mode économie ?'
                        },
                        'context': {
                            'envelope': envelope.envelope_type,
                            'budget': budget,
                            'spent': spent,
                            'projected_overspend': projected_overspend,
                            'percent_spent': percent_spent,
                            'days_remaining': days_remaining
                        }
                    }
                )
                if created:
                    alerts_created.append(alert)

            # ALERTE INFO : Bon rythme mais surveillance
            elif percent_spent > 80 and projected_overspend <= 0:
                alert, created = PredictiveAlert.objects.get_or_create(
                    user=user,
                    alert_type='budget_warning',
                    title=f"Budget {envelope.envelope_type} bientôt épuisé",
                    defaults={
                        'severity': 'info',
                        'message': f"Tu as utilisé {percent_spent:.0f}% de ton budget {envelope.envelope_type}. Il reste {budget - spent:,.0f} FCFA pour {days_remaining} jours.",
                        'suggested_action': None,
                        'context': {
                            'envelope': envelope.envelope_type,
                            'budget': budget,
                            'spent': spent,
                            'remaining': budget - spent,
                            'days_remaining': days_remaining
                        }
                    }
                )
                if created:
                    alerts_created.append(alert)

        # ========== 2. ALERTES TONTINES ==========
        # Récupérer les tontines actives de l'utilisateur
        user_tontines = TontineParticipant.objects.filter(
            user=user,
            tontine__status='active'
        ).select_related('tontine')

        for participation in user_tontines:
            tontine = participation.tontine

            # Vérifier si contribution due ce mois
            contributions_this_month = TontineContribution.objects.filter(
                participant=participation,
                date__gte=start_of_month
            )

            if not contributions_this_month.exists():
                # Pas encore contribué ce mois
                days_until_end = days_remaining

                if days_until_end <= 5:
                    alert, created = PredictiveAlert.objects.get_or_create(
                        user=user,
                        alert_type='tontine_due',
                        title=f"Contribution tontine '{tontine.name}' due",
                        defaults={
                            'severity': 'warning' if days_until_end <= 2 else 'info',
                            'message': f"Ta contribution de {tontine.monthly_contribution:,.0f} FCFA pour '{tontine.name}' est due dans {days_until_end} jours.",
                            'suggested_action': {
                                'type': 'contribute_tontine',
                                'tontine_id': tontine.id,
                                'amount': float(tontine.monthly_contribution),
                                'message': 'Contribuer maintenant ?'
                            },
                            'context': {
                                'tontine_id': tontine.id,
                                'tontine_name': tontine.name,
                                'amount': float(tontine.monthly_contribution),
                                'days_remaining': days_until_end
                            }
                        }
                    )
                    if created:
                        alerts_created.append(alert)

        # Retourner toutes les alertes actives (non-dismissed)
        active_alerts = PredictiveAlert.objects.filter(
            user=user,
            is_dismissed=False
        ).order_by('-severity', '-created_at')

        alerts_data = [{
            'id': alert.id,
            'type': alert.alert_type,
            'severity': alert.severity,
            'title': alert.title,
            'message': alert.message,
            'suggested_action': alert.suggested_action,
            'context': alert.context,
            'created_at': alert.created_at.isoformat()
        } for alert in active_alerts]

        return Response({
            'alerts': alerts_data,
            'new_alerts_count': len(alerts_created)
        })

    except Exception as e:
        return Response({
            'error': f'Erreur génération prédictions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_alert(request, alert_id):
    """Ignorer une alerte"""
    user = request.user

    try:
        alert = PredictiveAlert.objects.get(id=alert_id, user=user)
        alert.dismiss()

        return Response({
            'success': True,
            'message': 'Alerte ignorée'
        })
    except PredictiveAlert.DoesNotExist:
        return Response({
            'error': 'Alerte introuvable'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def execute_prediction_action(request, alert_id):
    """Exécuter l'action suggérée par une alerte"""
    user = request.user

    try:
        alert = PredictiveAlert.objects.get(id=alert_id, user=user)

        if not alert.suggested_action:
            return Response({
                'error': 'Aucune action disponible'
            }, status=status.HTTP_400_BAD_REQUEST)

        action = alert.suggested_action
        action_type = action.get('type')

        # Exécuter l'action selon le type
        if action_type == 'contribute_tontine':
            # Créer la contribution
            tontine_id = action.get('tontine_id')
            amount = action.get('amount')

            tontine = Tontine.objects.get(id=tontine_id)
            participant = TontineParticipant.objects.get(tontine=tontine, user=user)

            contribution = TontineContribution.objects.create(
                participant=participant,
                amount=amount,
                date=timezone.now().date()
            )

            alert.mark_action_taken()

            return Response({
                'success': True,
                'message': f'Contribution de {amount:,.0f} FCFA enregistrée !',
                'contribution_id': contribution.id
            })

        else:
            return Response({
                'error': f'Action non implémentée: {action_type}'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# api/views.py - AJOUTER cette fonction

import base64
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import anthropic
import json
import re



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_premium("Scanner OCR")  # ✅ AJOUTER cette ligne
def scan_receipt(request):
    """
    Scanner un reçu avec Claude Vision API

    Body attendu:
    {
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." (ou juste la partie base64)
    }

    Retourne:
    {
        "amount": 23450,
        "merchant": "Auchan",
        "category": "alimentation",
        "description": "Courses Auchan",
        "date": "2026-02-22",
        "items": ["Riz 10kg", "Huile 2L", "Lait"],
        "confidence": "high"
    }
    """
    user = request.user

    try:
        image_data = request.data.get('image', '')

        if not image_data:
            return Response({
                'error': 'Image requise'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Nettoyer le base64 si nécessaire
        if 'base64,' in image_data:
            # Format: data:image/jpeg;base64,XXXXX
            image_data = image_data.split('base64,')[1]

        # Détecter le type d'image
        media_type = 'image/jpeg'  # Par défaut
        if image_data.startswith('iVBOR'):
            media_type = 'image/png'
        elif image_data.startswith('/9j/'):
            media_type = 'image/jpeg'
        elif image_data.startswith('R0lG'):
            media_type = 'image/gif'

        # Appeler Claude Vision
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        system_prompt = """Tu es un expert en lecture de reçus de caisse sénégalais.

CONTEXTE :
- Localisation : Sénégal, Afrique de l'Ouest
- Devise : FCFA (Franc CFA)
- Magasins courants : Auchan, Casino, Exclusive, Station Total, boutiques locales

TON RÔLE :
Extraire les informations d'un reçu de caisse et retourner du JSON structuré.

FORMAT DE RÉPONSE (JSON strict) :
{
  "amount": 23450,
  "merchant": "Auchan Dakar",
  "category": "alimentation",
  "description": "Courses Auchan",
  "date": "2026-02-22",
  "items": ["Riz 10kg - 8500 FCFA", "Huile 2L - 3000 FCFA"],
  "confidence": "high",
  "raw_text": "Texte brut du reçu si nécessaire"
}

CATÉGORIES POSSIBLES :
- alimentation
- transport
- logement
- santé
- éducation
- loisirs
- vêtements
- spiritualité
- famille
- autre

RÈGLES :
1. Montant TOTAL du reçu (pas les sous-totaux)
2. Si montant en FCFA, enlever les espaces et convertir en nombre
3. Si pas de date visible, utiliser "2026-02-22" (date du jour)
4. Catégorie basée sur le type de magasin et articles
5. Description courte (ex: "Courses Auchan", "Taxi Course", "Essence Total")
6. Confidence: "high" si tout est clair, "medium" si incertain, "low" si illisible
7. Items: liste des principaux articles (max 5)
8. TOUJOURS retourner du JSON valide, même si reçu illisible

Si le reçu est illisible ou ce n'est pas un reçu :
{
  "amount": 0,
  "merchant": "Inconnu",
  "category": "autre",
  "description": "Reçu illisible",
  "date": "2026-02-22",
  "items": [],
  "confidence": "low",
  "error": "Image floue / pas un reçu"
}
"""

        response = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1000,
            system=system_prompt,
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image',
                            'source': {
                                'type': 'base64',
                                'media_type': media_type,
                                'data': image_data
                            }
                        },
                        {
                            'type': 'text',
                            'text': 'Extrais les informations de ce reçu et retourne du JSON.'
                        }
                    ]
                }
            ]
        )

        # Parser la réponse
        claude_response = response.content[0].text

        # Nettoyer le JSON
        cleaned = claude_response.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.startswith('```'):
            cleaned = cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Chercher le JSON entre { et }
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            cleaned = cleaned[start:end + 1]

        # Parser
        receipt_data = json.loads(cleaned)

        # Validation et nettoyage
        if not receipt_data.get('amount'):
            receipt_data['amount'] = 0

        if not receipt_data.get('category'):
            receipt_data['category'] = 'autre'

        if not receipt_data.get('date'):
            from datetime import datetime
            receipt_data['date'] = datetime.now().strftime('%Y-%m-%d')

        return Response({
            'success': True,
            'data': receipt_data,
            'message': f"Reçu scanné : {receipt_data.get('merchant', 'Inconnu')} - {receipt_data.get('amount', 0)} FCFA"
        })

    except json.JSONDecodeError as e:
        return Response({
            'error': f'Erreur parsing JSON: {str(e)}',
            'raw_response': claude_response if 'claude_response' in locals() else ''
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'error': f'Erreur scan reçu: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# api/views.py - AJOUTER ces fonctions

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Avg
from decimal import Decimal

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_yoonu_score(request):
    """Récupérer le Score Yoonu Dal"""
    user = request.user

    try:
        # calculate_yoonu_score retourne maintenant un DICT
        score_data = calculate_yoonu_score(user)

        # Gérer le cas où le score est None (pas de valeurs définies)
        if score_data is None:
            logger.warning(f"Score non calculé pour {user.username} - aucune valeur définie")
            return Response({
                'total_score': 0,
                'alignment_score': 0,
                'discipline_score': 0,
                'stability_score': 0,
                'improvement_score': 0,
                'score_change': 0,
                'level': 'Débutant',
                'emoji': '🌱',
                'alignment_details': {},
                'message': 'Définis tes valeurs personnelles pour calculer ton score'
            }, status=200)

        # ✅ score_data est maintenant un DICT, on peut le retourner directement
        return Response(score_data, status=200)
        
    except Exception as e:
        logger.error(f"❌ Erreur get_yoonu_score pour {user.username}: {e}", exc_info=True)
        return Response({
            'error': 'Erreur lors du calcul du score',
            'total_score': 0,
            'alignment_score': 0,
            'discipline_score': 0,
            'stability_score': 0,
            'improvement_score': 0,
            'score_change': 0,
            'level': 'Débutant',
            'emoji': '🌱',
            'alignment_details': {},
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_score_history(request):
    """Récupérer l'historique des scores (6 derniers mois)"""
    user = request.user

    try:
        history = ScoreHistory.objects.filter(user=user).order_by('-month')[:6]

        data = [{
            'month': h.month.strftime('%B %Y'),
            'total_score': h.total_score,
            'alignment': float(h.alignment_score),
            'discipline': float(h.discipline_score),
            'stability': float(h.stability_score),
            'improvement': float(h.improvement_score)
        } for h in reversed(list(history))]  # Ordre chronologique

        return Response({'history': data})
    except Exception as e:
        return Response({
            'error': f'Erreur historique: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# api/views.py - AJOUTER ces endpoints

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserValue


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_value(request):
    """Créer une valeur utilisateur"""
    user = request.user
    value = request.data.get('value')
    priority = request.data.get('priority')

    if not value or not priority:
        return Response({
            'error': 'value et priority requis'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Créer ou mettre à jour
        user_value, created = UserValue.objects.update_or_create(
            user=user,
            value=value,
            defaults={'priority': priority}
        )

        return Response({
            'id': user_value.id,
            'value': user_value.value,
            'priority': user_value.priority
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_values(request):
    """Récupérer les valeurs de l'utilisateur"""
    user = request.user

    try:
        values = UserValue.objects.filter(user=user).order_by('priority')

        return Response({
            'values': [{
                'id': v.id,
                'value': v.value,
                'priority': v.priority
            } for v in values]
        })

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_values(request):
    """Supprimer toutes les valeurs de l'utilisateur"""
    user = request.user

    try:
        UserValue.objects.filter(user=user).delete()
        return Response({'message': 'Valeurs supprimées'})

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_score_calculation(request):
    """Déclencher le calcul du score après le diagnostic"""
    user = request.user

    try:
        score_data = calculate_yoonu_score(user)

        if score_data:
            return Response({
                'message': 'Score calculé avec succès',
                'score': {
                    'total_score': score_data.get('total_score', 0),
                    'level': score_data.get('level', 'Débutant'),
                    'emoji': score_data.get('emoji', '🌱')
                }
            })
        else:
            return Response({
                'error': 'Impossible de calculer le score'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f'Erreur calcul score: {str(e)}', exc_info=True)
        return Response({
            'error': f'Erreur calcul score: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def score_history(request):
    """Historique du score Yoonu (30 derniers jours)"""
    try:
        # Pour l'instant, renvoyer des données vides
        # Tu pourras implémenter un vrai tracking plus tard
        return Response({
            'history': []
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# ==========================================
# AJOUTER CES FONCTIONS DANS api/views.py
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    """Marquer l'onboarding comme terminé et calculer le score initial"""
    user = request.user
    
    try:
        data = request.data
        
        # Mettre à jour le profil avec les données de l'onboarding
        profile = user.profile
        
        if 'monthly_income' in data:
            profile.monthly_income = Decimal(str(data['monthly_income']))
        
        if 'financial_goals' in data:
            profile.financial_goals = data['financial_goals']
        
        # Marquer l'onboarding comme terminé
        profile.onboarding_completed = True
        profile.save()
        
        # Créer les enveloppes par défaut
        create_default_envelopes(user)
        
        # Calculer le score initial (peut retourner None si pas de valeurs définies)
        score_data = calculate_yoonu_score(user)
        
        return Response({
            'message': 'Onboarding terminé avec succès',
            'onboarding_completed': True,
            'score_calculated': score_data is not None,
            'score': score_data if score_data else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Erreur complete_onboarding: {e}", exc_info=True)
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_onboarding_status(request):
    """Vérifier si l'utilisateur a terminé l'onboarding"""
    user = request.user
    
    try:
        profile = user.profile
        
        return Response({
            'onboarding_completed': profile.onboarding_completed,
            'has_values': UserValue.objects.filter(user=user).exists(),
            'has_income': profile.monthly_income > 0
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur check_onboarding_status: {e}", exc_info=True)
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# ==========================================
# CODE À AJOUTER DANS api/views.py
# ==========================================

# ✅ 1. AJOUTER CES IMPORTS EN HAUT DU FICHIER (si pas déjà présents)
from decimal import Decimal
from .models import Envelope, UserValue
from .calculate_yoonu_score import calculate_yoonu_score

# ✅ 2. AJOUTER CETTE FONCTION HELPER (avant les endpoints)
def create_default_envelopes(user):
    """
    Créer les enveloppes par défaut pour un nouvel utilisateur
    """
    default_envelopes = [
        {'name': 'Alimentation', 'icon': '🍽️', 'color': '#10B981'},
        {'name': 'Transport', 'icon': '🚗', 'color': '#3B82F6'},
        {'name': 'Logement', 'icon': '🏠', 'color': '#8B5CF6'},
        {'name': 'Santé', 'icon': '💊', 'color': '#EF4444'},
        {'name': 'Loisirs', 'icon': '🎮', 'color': '#F59E0B'},
        {'name': 'Épargne', 'icon': '💰', 'color': '#059669'},
    ]
    
    created_count = 0
    for env_data in default_envelopes:
        # Créer uniquement si n'existe pas déjà
        envelope, created = Envelope.objects.get_or_create(
            user=user,
            name=env_data['name'],
            defaults={
                'icon': env_data['icon'],
                'color': env_data['color'],
                'budget_amount': Decimal('0.00'),
                'current_amount': Decimal('0.00'),
                'is_default': True
            }
        )
        if created:
            created_count += 1
    
    logger.info(f"✅ {created_count} enveloppes créées pour {user.username}")
    return created_count


# ✅ 3. AJOUTER CES DEUX ENDPOINTS

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    """Marquer l'onboarding comme terminé et calculer le score initial"""
    user = request.user
    
    try:
        data = request.data
        logger.info(f"🎯 Complete onboarding pour {user.username}: {data}")
        
        # Mettre à jour le profil avec les données de l'onboarding
        profile = user.profile
        
        if 'monthly_income' in data:
            profile.monthly_income = Decimal(str(data['monthly_income']))
            logger.info(f"💰 Revenu mensuel défini: {profile.monthly_income}")
        
        if 'financial_goals' in data:
            profile.financial_goals = data['financial_goals']
        
        # Marquer l'onboarding comme terminé
        profile.onboarding_completed = True
        profile.save()
        logger.info(f"✅ Onboarding marqué comme terminé pour {user.username}")
        
        # Créer les enveloppes par défaut
        try:
            envelopes_created = create_default_envelopes(user)
            logger.info(f"📬 {envelopes_created} enveloppes créées")
        except Exception as env_error:
            logger.warning(f"⚠️ Erreur création enveloppes (non bloquant): {env_error}")
        
        # Calculer le score initial
        try:
            score_data = calculate_yoonu_score(user)
            logger.info(f"📊 Score calculé: {score_data}")
        except Exception as score_error:
            logger.warning(f"⚠️ Erreur calcul score (non bloquant): {score_error}")
            score_data = None
        
        return Response({
            'message': 'Onboarding terminé avec succès',
            'onboarding_completed': True,
            'score_calculated': score_data is not None,
            'score': score_data if score_data else {'total_score': 0, 'message': 'Score sera calculé après ajout de dépenses'}
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Erreur complete_onboarding: {e}", exc_info=True)
        return Response({
            'error': f'Erreur: {str(e)}',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_onboarding_status(request):
    """Vérifier si l'utilisateur a terminé l'onboarding"""
    user = request.user
    
    try:
        profile = user.profile
        
        return Response({
            'onboarding_completed': profile.onboarding_completed,
            'has_values': UserValue.objects.filter(user=user).exists(),
            'has_income': profile.monthly_income > 0
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur check_onboarding_status: {e}", exc_info=True)
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# SYSTÈME 4 ENVELOPPES HYBRIDES
# ==========================================

META_ENVELOPES_CONFIG = [
    {
        'type': 'essentiels',
        'name': 'Essentiels',
        'icon': '🏠',
        'description': 'Alimentation, Transport, Logement, Santé',
        'default_percentage': 50,
        'categories': ['alimentation', 'transport', 'logement', 'sante']
    },
    {
        'type': 'plaisirs',
        'name': 'Plaisirs',
        'icon': '🎉',
        'description': 'Loisirs, Sorties, Vêtements',
        'default_percentage': 30,
        'categories': ['loisirs', 'vetements', 'autre']
    },
    {
        'type': 'projets',
        'name': 'Projets',
        'icon': '💎',
        'description': 'Épargne, Investissement, Formation, Famille',
        'default_percentage': 20,
        'categories': ['education', 'famille', 'spiritualite']
    },
    {
        'type': 'liberation',
        'name': 'Libération',
        'icon': '🔓',
        'description': 'Dettes, Crédits, Solidarité familiale',
        'default_percentage': 0,
        'categories': []
    }
]

def get_categories_for_envelope(envelope_type):
    """Retourne les catégories de dépenses pour un type d'enveloppe."""
    for config in META_ENVELOPES_CONFIG:
        if config['type'] == envelope_type:
            return config['categories']
    return []

def create_default_meta_envelopes(user):
    """Crée les 4 méta-enveloppes par défaut pour un utilisateur."""
    try:
        profile = user.profile
        monthly_income = profile.monthly_income or 0
    except:
        monthly_income = 0
    
    for config in META_ENVELOPES_CONFIG:
        envelope, created = Envelope.objects.get_or_create(
            user=user,
            envelope_type=config['type'],
            is_meta_envelope=True,
            defaults={
                'name': config['name'],
                'allocated_percentage': config['default_percentage'],
                'monthly_budget': (monthly_income * config['default_percentage']) / 100,
                'current_spent': 0
            }
        )
        
        if not created and envelope.name != config['name']:
            envelope.name = config['name']
            envelope.save()

def update_envelope_spending(user):
    """Met à jour les dépenses pour chaque enveloppe."""
    from django.utils import timezone
    from datetime import datetime
    
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    for envelope in Envelope.objects.filter(user=user, is_meta_envelope=True):
        categories = get_categories_for_envelope(envelope.envelope_type)
        if categories:
            total_spent = Expense.objects.filter(
                user=user,
                category__in=categories,
                date__gte=current_month
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            envelope.current_spent = total_spent
            envelope.save()

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_meta_envelopes(request):
    """Gérer les 4 méta-enveloppes."""
    user = request.user
    
    if request.method == 'GET':
        # Créer les enveloppes si elles n'existent pas
        if not Envelope.objects.filter(user=user, is_meta_envelope=True).exists():
            create_default_meta_envelopes(user)
        
        # Mettre à jour les dépenses
        update_envelope_spending(user)
        
        # Récupérer toutes les enveloppes
        envelopes = Envelope.objects.filter(user=user, is_meta_envelope=True).order_by('envelope_type')
        
        envelopes_data = []
        for env in envelopes:
            config = next((c for c in META_ENVELOPES_CONFIG if c['type'] == env.envelope_type), None)
            
            envelopes_data.append({
                'id': env.id,
                'envelope_type': env.envelope_type,
                'name': env.name or (config['name'] if config else ''),
                'icon': config['icon'] if config else '📁',
                'description': config['description'] if config else '',
                'allocated_percentage': float(env.allocated_percentage),
                'monthly_budget': float(env.monthly_budget),
                'current_spent': float(env.current_spent),
                'remaining_budget': float(env.monthly_budget - env.current_spent),
                'usage_percentage': round((env.current_spent / env.monthly_budget * 100) if env.monthly_budget > 0 else 0, 1),
                'status': 'over' if env.current_spent > env.monthly_budget else 'warning' if env.current_spent > env.monthly_budget * 0.8 else 'good'
            })
        
        try:
            monthly_income = user.profile.monthly_income
        except:
            monthly_income = 0
        
        return Response({
            'envelopes': envelopes_data,
            'monthly_income': float(monthly_income)
        })
    
    elif request.method == 'POST':
        # Modifier les pourcentages
        data = request.data
        
        essentiels_pct = Decimal(str(data.get('essentiels_percentage', 50)))
        plaisirs_pct = Decimal(str(data.get('plaisirs_percentage', 30)))
        projets_pct = Decimal(str(data.get('projets_percentage', 20)))
        liberation_pct = Decimal(str(data.get('liberation_percentage', 0)))
        
        total = essentiels_pct + plaisirs_pct + projets_pct + liberation_pct
        
        if total != 100:
            return Response({
                'error': f'Le total doit être 100%. Actuellement: {total}%'
            }, status=400)
        
        try:
            monthly_income = user.profile.monthly_income or 0
        except:
            monthly_income = 0
        
        # Mettre à jour chaque enveloppe
        mapping = {
            'essentiels': essentiels_pct,
            'plaisirs': plaisirs_pct,
            'projets': projets_pct,
            'liberation': liberation_pct
        }
        
        for env_type, percentage in mapping.items():
            env, created = Envelope.objects.get_or_create(
                user=user,
                envelope_type=env_type,
                is_meta_envelope=True
            )
            env.allocated_percentage = percentage
            env.monthly_budget = (monthly_income * percentage) / 100
            env.save()
        
        return Response({'message': 'Enveloppes mises à jour avec succès'})


