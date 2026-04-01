# REMPLACE ces 2 fonctions dans api/views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_onboarding_status(request):
    """Vérifie si l'utilisateur a complété l'onboarding"""
    user = request.user
    
    try:
        # Vérifier si diagnostic complété (EVER, pas juste ce mois)
        has_diagnostic = DiagnosticResult.objects.filter(user=user).exists()
        
        # Vérifier si valeurs définies
        has_values = UserValue.objects.filter(user=user).exists()
        
        # Vérifier si revenus configurés (profile OU historique)
        has_income = (user.profile.monthly_income and user.profile.monthly_income > 0) or \
                     Income.objects.filter(user=user).exists()
        
        onboarding_complete = has_diagnostic and has_values and has_income
        
        return Response({
            'onboarding_complete': onboarding_complete,
            'steps': {
                'diagnostic': has_diagnostic,
                'values': has_values,
                'income': has_income
            }
        })
        
    except Exception as e:
        return Response({
            'onboarding_complete': False,
            'steps': {
                'diagnostic': False,
                'values': False,
                'income': False
            },
            'error': str(e)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    """Marque l'onboarding comme complété + met à jour le profil + calcule score"""
    user = request.user
    
    try:
        data = request.data
        
        # 1. Mettre à jour le revenu mensuel
        monthly_income = data.get('monthly_income')
        if monthly_income:
            user.profile.monthly_income = Decimal(str(monthly_income))
            user.profile.save()
        
        # 2. Mettre à jour les objectifs si fournis
        financial_goals = data.get('financial_goals', '')
        if financial_goals:
            user.profile.financial_goals = financial_goals
            user.profile.save()
        
        # 3. Créer un diagnostic de base avec scores initiaux
        DiagnosticResult.objects.get_or_create(
            user=user,
            defaults={
                'financial_health_score': 50,
                'savings_capacity_score': 50,
                'planning_score': 50,
                'risk_management_score': 50,
                'overall_score': 50,
                'recommendations': {
                    'message': 'Diagnostic initial - Commence à suivre tes dépenses pour améliorer ton score'
                }
            }
        )
        
        # 4. Calculer le score Yoonu Dal
        try:
            score_data = calculate_yoonu_score(user)
            total_score = score_data.get('total_score', 47) if isinstance(score_data, dict) else 47
        except Exception as e:
            print(f"Erreur calcul score: {e}")
            total_score = 47  # Score par défaut
        
        return Response({
            'success': True,
            'message': 'Onboarding complété avec succès',
            'score': {
                'total_score': total_score
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
