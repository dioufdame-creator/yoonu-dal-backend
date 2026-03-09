from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Transaction
import uuid
from functools import wraps
from rest_framework.response import Response


def require_premium(view_func):
    """Décorateur pour restreindre aux utilisateurs Premium ou en essai"""

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user

        # Vérifier si Premium ou en essai actif
        if hasattr(user, 'profile'):
            profile = user.profile
            is_premium = profile.subscription_tier == 'premium'
            is_trial = profile.trial_active

            if is_premium or is_trial:
                return view_func(request, *args, **kwargs)

        # Sinon, refuser l'accès
        return Response(
            {
                'error': 'Cette fonctionnalité est réservée aux abonnés Premium',
                'upgrade_required': True
            },
            status=403
        )

    return wrapper


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mobile_money_payment(request):
    provider = request.data.get('provider')
    phone_number = request.data.get('phone_number')
    amount = request.data.get('amount')
    plan = request.data.get('plan', 'monthly')

    if not all([provider, phone_number, amount]):
        return Response({'error': 'Données manquantes'}, status=400)

    transaction = Transaction.objects.create(
        user=request.user,
        transaction_id=str(uuid.uuid4()),
        provider=provider,
        phone_number=phone_number,
        amount=amount,
        plan=plan,
        status='pending'
    )

    return Response({
        'success': True,
        'transaction_id': transaction.transaction_id,
        'message': f'Demande envoyée. Valide sur ton téléphone'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, transaction_id):
    try:
        transaction = Transaction.objects.get(
            transaction_id=transaction_id,
            user=request.user
        )

        # Pour dev : marquer comme completed après 30s
        if transaction.status == 'pending':
            if (timezone.now() - transaction.created_at).seconds > 30:
                transaction.status = 'completed'
                transaction.save()
                activate_premium(request.user, transaction.plan)

        return Response({
            'status': transaction.status,
            'transaction_id': transaction.transaction_id
        })

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction introuvable'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def card_payment(request):
    amount = request.data.get('amount')
    plan = request.data.get('plan', 'monthly')

    if not amount:
        return Response({'error': 'Données manquantes'}, status=400)

    transaction = Transaction.objects.create(
        user=request.user,
        transaction_id=str(uuid.uuid4()),
        provider='card',
        amount=amount,
        plan=plan,
        status='completed'
    )

    activate_premium(request.user, plan)

    return Response({
        'success': True,
        'message': 'Paiement réussi !',
        'transaction_id': transaction.transaction_id
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_trial(request):
    user_profile = request.user.profile

    if user_profile.trial_used:
        return Response({'error': 'Trial déjà utilisé'}, status=400)

    if user_profile.start_trial():
        return Response({
            'success': True,
            'message': '30 jours d\'essai Premium activés !',
            'expires_at': user_profile.trial_expires_at
        })

    return Response({'error': 'Impossible de démarrer le trial'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    user_profile = request.user.profile
    user_profile.reset_monthly_limits()

    return Response({
        'subscription_tier': user_profile.subscription_tier,
        'is_premium': user_profile.is_premium_active(),
        'trial_active': user_profile.trial_active,
        'trial_days_remaining': user_profile.trial_days_remaining(),
        'trial_used': user_profile.trial_used,
        'ai_messages_count': user_profile.ai_messages_count,
        'ai_messages_limit': 50 if not user_profile.is_premium_active() else None
    })


def activate_premium(user, plan):
    """Active le Premium pour un user"""
    user_profile = user.profile
    user_profile.subscription_tier = 'premium'

    if plan == 'monthly':
        user_profile.subscription_expires_at = timezone.now() + timedelta(days=30)
    elif plan == 'yearly':
        user_profile.subscription_expires_at = timezone.now() + timedelta(days=365)

    user_profile.trial_active = False
    user_profile.save()