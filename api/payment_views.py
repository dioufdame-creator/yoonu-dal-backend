# api/payment_views.py
# Intégration PayDunya — PSR (Paiement Standard avec Redirection)
# ✅ Création facture PayDunya
# ✅ Webhook IPN pour activation automatique Premium
# ✅ Vérification statut transaction
# ✅ Trial 30 jours

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from datetime import timedelta
from .models import Transaction
import uuid
import requests
import hashlib
import json
from functools import wraps


# ==========================================
# DÉCORATEUR PREMIUM
# ==========================================

def require_premium(view_func):
    """Restreint aux utilisateurs Premium ou en essai"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user
        if hasattr(user, 'profile'):
            profile = user.profile
            if profile.subscription_tier == 'premium' or profile.trial_active:
                return view_func(request, *args, **kwargs)
        return Response(
            {
                'error': 'Cette fonctionnalité est réservée aux abonnés Premium',
                'upgrade_required': True
            },
            status=403
        )
    return wrapper


# ==========================================
# CONFIG PAYDUNYA
# ==========================================

def get_paydunya_headers():
    """Headers pour les requêtes PayDunya"""
    return {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': settings.PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': settings.PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': settings.PAYDUNYA_TOKEN,
    }


def get_paydunya_base_url():
    """URL sandbox ou production selon le mode"""
    mode = getattr(settings, 'PAYDUNYA_MODE', 'test')
    if mode == 'live':
        return 'https://app.paydunya.com/api/v1'
    return 'https://app.paydunya.com/sandbox-api/v1'


def get_paydunya_checkout_base():
    """URL de checkout sandbox ou production"""
    mode = getattr(settings, 'PAYDUNYA_MODE', 'test')
    if mode == 'live':
        return 'https://app.paydunya.com/checkout/invoice'
    return 'https://app.paydunya.com/sandbox-checkout/invoice'


# ==========================================
# CRÉER UNE FACTURE PAYDUNYA
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    Crée une facture PayDunya et retourne l'URL de paiement.
    L'utilisateur est redirigé vers PayDunya pour payer.
    """
    user = request.user
    plan = request.data.get('plan', 'monthly')

    pricing = {
        'monthly': {'amount': 1500, 'label': 'Abonnement Mensuel Yoonu Dal'},
        'yearly':  {'amount': 15000, 'label': 'Abonnement Annuel Yoonu Dal'},
    }

    if plan not in pricing:
        return Response({'error': 'Plan invalide'}, status=400)

    selected = pricing[plan]
    transaction_id = str(uuid.uuid4())

    # Créer la transaction en base
    transaction = Transaction.objects.create(
        user=user,
        transaction_id=transaction_id,
        provider='paydunya',
        phone_number='',
        amount=selected['amount'],
        plan=plan,
        status='pending'
    )

    # URLs de retour
    base_url = 'https://yoonudal.com'
    return_url = f"{base_url}/payment/success?transaction_id={transaction_id}"
    cancel_url = f"{base_url}/payment/cancel"

    # Payload PayDunya
    payload = {
        "invoice": {
            "total_amount": selected['amount'],
            "description": selected['label'],
        },
        "store": {
            "name": "Yoonu Dal",
            "tagline": "Ton coach financier personnel",
            "postal_address": "Dakar, Sénégal",
            "phone": "+221771902641",
            "logo_url": "https://yoonudal.com/logo.png",
            "website_url": "https://yoonudal.com",
        },
        "actions": {
            "cancel_url": cancel_url,
            "return_url": return_url,
            "callback_url": f"https://yoonudal-api.onrender.com/api/payments/ipn/",
        },
        "custom_data": {
            "transaction_id": transaction_id,
            "user_id": str(user.id),
            "plan": plan,
        }
    }

    try:
        base_url_api = get_paydunya_base_url()
        headers = get_paydunya_headers()

        # DEBUG temporaire
        print(f"=== PAYDUNYA DEBUG ===")
        print(f"MODE: {getattr(settings, 'PAYDUNYA_MODE', 'NON DEFINI')}")
        print(f"MASTER_KEY: {settings.PAYDUNYA_MASTER_KEY}")
        print(f"PRIVATE_KEY: {settings.PAYDUNYA_PRIVATE_KEY}")
        print(f"TOKEN: {settings.PAYDUNYA_TOKEN}")
        print(f"URL: {base_url_api}/checkout-invoice/create")
        print(f"=== FIN DEBUG ===")

        response = requests.post(
            f"{base_url_api}/checkout-invoice/create",
            headers=headers,
            json=payload,
            timeout=30
        )
        data = response.json()
        print(f"PAYDUNYA RESPONSE: {data}")

        if data.get('response_code') == '00':
            paydunya_token = data.get('token')
            checkout_url = f"{get_paydunya_checkout_base()}/{paydunya_token}"

            # Sauvegarder le token PayDunya
            transaction.phone_number = paydunya_token  # réutilise ce champ pour stocker le token
            transaction.save()

            return Response({
                'success': True,
                'checkout_url': checkout_url,
                'transaction_id': transaction_id,
                'paydunya_token': paydunya_token,
            })
        else:
            transaction.status = 'failed'
            transaction.save()
            return Response({
                'error': data.get('response_text', 'Erreur PayDunya'),
            }, status=400)

    except requests.exceptions.Timeout:
        return Response({'error': 'Timeout PayDunya — réessaie'}, status=504)
    except Exception as e:
        transaction.status = 'failed'
        transaction.save()
        return Response({'error': f'Erreur: {str(e)}'}, status=500)


# ==========================================
# WEBHOOK IPN — ACTIVATION AUTOMATIQUE
# ==========================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def paydunya_ipn(request):
    """
    Webhook PayDunya — appelé automatiquement quand un paiement est confirmé.
    Active le Premium pour l'utilisateur concerné.
    """
    try:
        data = request.data

        # Vérifier la signature (hash de la Master Key)
        received_hash = data.get('hash', '')
        master_key = settings.PAYDUNYA_MASTER_KEY
        expected_hash = hashlib.sha512(master_key.encode()).hexdigest()

        if received_hash != expected_hash:
            return Response({'error': 'Signature invalide'}, status=403)

        # Récupérer les données
        status_paydunya = data.get('status', '')
        custom_data = data.get('custom_data', {})
        transaction_id = custom_data.get('transaction_id')
        plan = custom_data.get('plan', 'monthly')

        if not transaction_id:
            return Response({'error': 'transaction_id manquant'}, status=400)

        try:
            transaction = Transaction.objects.get(transaction_id=transaction_id)
        except Transaction.DoesNotExist:
            return Response({'error': 'Transaction introuvable'}, status=404)

        if status_paydunya == 'completed':
            transaction.status = 'completed'
            transaction.save()
            activate_premium(transaction.user, plan)

        elif status_paydunya == 'failed' or status_paydunya == 'cancelled':
            transaction.status = 'failed'
            transaction.save()

        return Response({'message': 'IPN reçu'}, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ==========================================
# VÉRIFICATION STATUT
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, transaction_id):
    """Vérifie le statut d'une transaction"""
    try:
        transaction = Transaction.objects.get(
            transaction_id=transaction_id,
            user=request.user
        )

        # Si toujours pending, vérifier côté PayDunya
        if transaction.status == 'pending' and transaction.phone_number:
            paydunya_token = transaction.phone_number
            try:
                base_url_api = get_paydunya_base_url()
                response = requests.get(
                    f"{base_url_api}/checkout-invoice/confirm/{paydunya_token}",
                    headers=get_paydunya_headers(),
                    timeout=15
                )
                data = response.json()

                if data.get('response_code') == '00':
                    invoice_status = data.get('status', '')
                    if invoice_status == 'completed':
                        transaction.status = 'completed'
                        transaction.save()
                        activate_premium(transaction.user, transaction.plan)
                    elif invoice_status in ['failed', 'cancelled']:
                        transaction.status = 'failed'
                        transaction.save()
            except Exception:
                pass  # On garde le statut pending si erreur réseau

        return Response({
            'status': transaction.status,
            'transaction_id': transaction.transaction_id,
            'is_premium': transaction.user.profile.is_premium_active(),
        })

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction introuvable'}, status=404)


# ==========================================
# TRIAL GRATUIT
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_trial(request):
    """Démarre l'essai gratuit 30 jours"""
    user_profile = request.user.profile

    if user_profile.trial_used:
        return Response({'error': 'Essai gratuit déjà utilisé'}, status=400)

    if user_profile.start_trial():
        return Response({
            'success': True,
            'message': '30 jours d\'essai Premium activés !',
            'expires_at': user_profile.trial_expires_at.isoformat()
        })

    return Response({'error': 'Impossible de démarrer l\'essai'}, status=400)


# ==========================================
# STATUT ABONNEMENT
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """Statut abonnement de l'utilisateur"""
    user_profile = request.user.profile
    user_profile.reset_monthly_limits()

    return Response({
        'subscription_tier': user_profile.subscription_tier,
        'is_premium': user_profile.is_premium_active(),
        'trial_active': user_profile.trial_active,
        'trial_days_remaining': user_profile.trial_days_remaining(),
        'trial_used': user_profile.trial_used,
        'ai_messages_count': user_profile.ai_messages_count,
        'ai_messages_limit': 50 if not user_profile.is_premium_active() else None,
        'subscription_expires_at': (
            user_profile.subscription_expires_at.isoformat()
            if user_profile.subscription_expires_at else None
        ),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    """Historique des transactions de l'utilisateur"""
    transactions = Transaction.objects.filter(
        user=request.user
    ).order_by('-created_at')[:20]

    return Response([{
        'id': t.id,
        'transaction_id': t.transaction_id,
        'amount': float(t.amount),
        'plan': t.plan,
        'status': t.status,
        'provider': t.provider,
        'created_at': t.created_at.isoformat(),
    } for t in transactions])


# ==========================================
# ACTIVER LE PREMIUM
# ==========================================

def activate_premium(user, plan):
    """Active le Premium pour un utilisateur"""
    profile = user.profile
    profile.subscription_tier = 'premium'
    profile.trial_active = False

    if plan == 'yearly':
        profile.subscription_expires_at = timezone.now() + timedelta(days=365)
    else:
        profile.subscription_expires_at = timezone.now() + timedelta(days=30)

    profile.save()
