import os
from functools import wraps
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status


def require_premium(feature_name="cette fonctionnalité"):
    """Decorator pour protéger endpoints Premium"""

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user_profile = request.user.profile

            if not user_profile.is_premium_active():
                return Response({
                    'error': f'{feature_name} est réservé aux membres Premium',
                    'feature': feature_name,
                    'upgrade_required': True,
                    'trial_available': not user_profile.trial_used
                }, status=status.HTTP_403_FORBIDDEN)

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def _env_int(name, default):
    """Lit un entier dans les variables d'environnement (Render), avec valeur par défaut."""
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def check_usage_limit(limit_field, max_limit, error_message):
    """Decorator pour vérifier limites d'usage.

    Pour les messages IA ('ai_messages_count'), les plafonds se règlent depuis
    Render sans modifier le code :
      - AI_FREE_MONTHLY_LIMIT    : messages IA par mois pour un compte gratuit
                                   (défaut : valeur passée au décorateur, soit 50)
      - AI_PREMIUM_MONTHLY_LIMIT : plafond de sécurité pour Premium / essai
                                   (défaut : 300 ; mettre 0 pour illimité)
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user_profile = request.user.profile

            # Reset automatique si nouveau mois
            user_profile.reset_monthly_limits()

            is_ai = limit_field == 'ai_messages_count'
            is_premium = user_profile.is_premium_active()

            if is_premium:
                premium_limit = _env_int('AI_PREMIUM_MONTHLY_LIMIT', 300) if is_ai else 0
                if premium_limit <= 0:
                    return view_func(request, *args, **kwargs)
                limit = premium_limit
            else:
                limit = _env_int('AI_FREE_MONTHLY_LIMIT', max_limit) if is_ai else max_limit

            current_usage = getattr(user_profile, limit_field, 0)

            if current_usage >= limit:
                if is_premium:
                    return Response({
                        'error': f'Limite de sécurité atteinte ({limit} {error_message} ce mois-ci). '
                                 f'Elle se réinitialise au début du mois prochain.',
                        'used': current_usage,
                        'limit': limit,
                        'upgrade_required': False,
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
                return Response({
                    'error': f'Tu as utilisé tes {limit} {error_message} gratuits ce mois-ci. '
                             f'Passe Premium pour continuer sans limite.',
                    'used': current_usage,
                    'limit': limit,
                    'upgrade_required': True,
                    'trial_available': not user_profile.trial_used
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            setattr(user_profile, limit_field, current_usage + 1)
            user_profile.save()

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
