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


def check_usage_limit(limit_field, max_limit, error_message):
    """Decorator pour vérifier limites d'usage"""

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user_profile = request.user.profile

            if user_profile.is_premium_active():
                return view_func(request, *args, **kwargs)

            current_usage = getattr(user_profile, limit_field, 0)

            if current_usage >= max_limit:
                return Response({
                    'error': f'Limite {error_message} atteinte ({max_limit}/mois)',
                    'used': current_usage,
                    'limit': max_limit,
                    'upgrade_required': True
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            setattr(user_profile, limit_field, current_usage + 1)
            user_profile.save()

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator