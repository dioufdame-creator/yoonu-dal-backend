# api/notification_views.py
# Gestion des notifications push FCM pour Yoonu Dal

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from .models import (
    Income, Expense, Envelope, TontineParticipant,
    TontineContribution, UserProfile
)
from django.db.models import Sum
import calendar as cal_module
import requests
import json
from decimal import Decimal


# ==========================================
# ENREGISTRER LE TOKEN FCM
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_fcm_token(request):
    """Enregistre le token FCM de l'utilisateur"""
    token = request.data.get('token')

    if not token:
        return Response({'error': 'Token requis'}, status=400)

    profile = request.user.profile
    profile.fcm_token = token
    profile.save(update_fields=['fcm_token'])

    return Response({'message': 'Token enregistré', 'success': True})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unregister_fcm_token(request):
    """Supprime le token FCM (déconnexion)"""
    profile = request.user.profile
    profile.fcm_token = None
    profile.save(update_fields=['fcm_token'])

    return Response({'message': 'Token supprimé'})


# ==========================================
# ENVOYER UNE NOTIFICATION FCM
# ==========================================

def send_fcm_notification(token, title, body, data=None, url='/'):
    """
    Envoie une notification push via FCM HTTP V1
    """
    if not token:
        return False

    fcm_url = f"https://fcm.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/messages:send"

    headers = {
        'Authorization': f'Bearer {get_access_token()}',
        'Content-Type': 'application/json',
    }

    message = {
        'message': {
            'token': token,
            'notification': {
                'title': title,
                'body': body,
            },
            'webpush': {
                'notification': {
                    'title': title,
                    'body': body,
                    'icon': '/logo192.png',
                    'badge': '/logo192.png',
                    'vibrate': [200, 100, 200],
                    'requireInteraction': False,
                },
                'fcm_options': {
                    'link': f'https://yoonudal.com{url}'
                }
            },
            'data': data or {}
        }
    }

    try:
        response = requests.post(fcm_url, headers=headers, json=message, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f'Erreur FCM: {e}')
        return False


def get_access_token():
    """Obtient un access token Google pour FCM V1"""
    try:
        import google.auth
        import google.auth.transport.requests
        from google.oauth2 import service_account

        credentials = service_account.Credentials.from_service_account_file(
            settings.FIREBASE_SERVICE_ACCOUNT_PATH,
            scopes=['https://www.googleapis.com/auth/firebase.messaging']
        )
        credentials.refresh(google.auth.transport.requests.Request())
        return credentials.token
    except Exception as e:
        print(f'Erreur access token: {e}')
        return None


# ==========================================
# VÉRIFIER ET ENVOYER LES NOTIFICATIONS
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_and_notify(request):
    """
    Vérifie les conditions et envoie les notifications pertinentes.
    Appelé au chargement de l'app ou manuellement.
    """
    user = request.user
    profile = user.profile
    token = getattr(profile, 'fcm_token', None)

    if not token:
        return Response({'message': 'Pas de token FCM', 'notifications_sent': 0})

    now = timezone.now()
    day = now.day
    notifications_sent = 0

    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    days_in_month = cal_module.monthrange(now.year, now.month)[1]

    # ── 1. Aucun revenu ce mois ──────────────────────────────────
    if day >= 5:
        monthly_income = Income.objects.filter(
            user=user,
            date__gte=start_of_month.date()
        ).aggregate(total=Sum('amount'))['total'] or 0

        if monthly_income == 0:
            sent = send_fcm_notification(
                token,
                title='💰 Revenu non enregistré',
                body=f'Tu n\'as pas encore saisi ton revenu de {now.strftime("%B")}. Ajoute-le pour suivre ton budget.',
                url='/dashboard'
            )
            if sent:
                notifications_sent += 1

    # ── 2. Aucune dépense essentielle jusqu'au 10 ────────────────
    if day >= 10:
        essential_categories = [
            'loyer', 'alimentation', 'transport', 'sante_courante',
            'eau_electricite', 'telephone_internet', 'aide_menagere', 'solidarite_famille'
        ]
        essential_expenses = Expense.objects.filter(
            user=user,
            category__in=essential_categories,
            date__gte=start_of_month.date()
        ).count()

        if essential_expenses == 0:
            sent = send_fcm_notification(
                token,
                title='🏠 Dépenses essentielles manquantes',
                body='Aucune dépense essentielle enregistrée ce mois. Pense à saisir ton loyer, alimentation, transport...',
                url='/dashboard'
            )
            if sent:
                notifications_sent += 1

    # ── 3. Budget enveloppe dépassé ──────────────────────────────
    envelopes = Envelope.objects.filter(user=user)
    for envelope in envelopes:
        if envelope.monthly_budget > 0:
            spent = Expense.objects.filter(
                user=user,
                category__in=_get_categories_for_envelope(envelope.envelope_type),
                date__gte=start_of_month.date()
            ).aggregate(total=Sum('amount'))['total'] or 0

            if float(spent) > float(envelope.monthly_budget):
                overspend = float(spent) - float(envelope.monthly_budget)
                sent = send_fcm_notification(
                    token,
                    title=f'⚠️ Budget {envelope.envelope_type} dépassé',
                    body=f'Tu as dépassé de {int(overspend):,} FCFA ton budget {envelope.envelope_type}.',
                    url='/envelopes'
                )
                if sent:
                    notifications_sent += 1
                    break  # Max 1 alerte budget par check

    # ── 4. Contribution tontine due ──────────────────────────────
    days_remaining = days_in_month - day
    if days_remaining <= 5:
        user_tontines = TontineParticipant.objects.filter(
            user=user, tontine__status='active'
        ).select_related('tontine')

        for participation in user_tontines:
            tontine = participation.tontine
            contributed = TontineContribution.objects.filter(
                participant=participation,
                date__gte=start_of_month.date()
            ).exists()

            if not contributed:
                sent = send_fcm_notification(
                    token,
                    title=f'🦁 Tontine "{tontine.name}"',
                    body=f'Ta contribution de {int(tontine.monthly_contribution):,} FCFA est due dans {days_remaining} jours.',
                    url='/tontines'
                )
                if sent:
                    notifications_sent += 1

    # ── 5. Solde négatif ─────────────────────────────────────────
    monthly_income = Income.objects.filter(
        user=user, date__gte=start_of_month.date()
    ).aggregate(total=Sum('amount'))['total'] or 0

    monthly_expenses = Expense.objects.filter(
        user=user, date__gte=start_of_month.date()
    ).aggregate(total=Sum('amount'))['total'] or 0

    if float(monthly_income) > 0 and float(monthly_expenses) > float(monthly_income):
        deficit = float(monthly_expenses) - float(monthly_income)
        sent = send_fcm_notification(
            token,
            title='🔴 Solde négatif ce mois',
            body=f'Tes dépenses dépassent tes revenus de {int(deficit):,} FCFA. Consulte ton dashboard.',
            url='/dashboard'
        )
        if sent:
            notifications_sent += 1

    return Response({
        'success': True,
        'notifications_sent': notifications_sent,
        'day_of_month': day
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_notification(request):
    """Envoie une notification de test"""
    user = request.user
    token = getattr(user.profile, 'fcm_token', None)

    if not token:
        return Response({'error': 'Pas de token FCM enregistré'}, status=400)

    sent = send_fcm_notification(
        token,
        title='🌿 Yoonu Dal fonctionne !',
        body='Les notifications push sont activées sur ton compte.',
        url='/dashboard'
    )

    if sent:
        return Response({'success': True, 'message': 'Notification envoyée !'})
    else:
        return Response({'error': 'Erreur envoi notification'}, status=500)


# ==========================================
# UTILITAIRES
# ==========================================

def _get_categories_for_envelope(envelope_type):
    mapping = {
        'essentiels': ['loyer', 'alimentation', 'transport', 'sante_courante',
                       'eau_electricite', 'telephone_internet', 'aide_menagere', 'solidarite_famille'],
        'plaisirs': ['restaurant', 'loisirs', 'vetements', 'beaute', 'voyage', 'autre'],
        'projets': ['education', 'epargne', 'fetes_ceremonies', 'spiritualite',
                    'sante_exceptionnelle', 'immobilier', 'tontine_epargne'],
        'liberation': ['remboursement_dette'],
    }
    return mapping.get(envelope_type, [])
