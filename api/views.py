# ========================================== 
# CORRECTIONS POUR views.py
# ==========================================

# IMPORTER EN HAUT DU FICHIER
import logging
from .calculate_yoonu_score import calculate_yoonu_score

logger = logging.getLogger(__name__)


# ==========================================
# 1. FIX get_yoonu_score (ligne 2972)
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_yoonu_score(request):
    """Récupérer le Score Yoonu Dal"""
    user = request.user

    try:
        # ✅ FIX 1: Utiliser calculate_yoonu_score au lieu de calculate_user_score
        score_data = calculate_yoonu_score(user)

        # ✅ FIX 2: Gérer le cas où le score est None ou un dict vide
        if not score_data or not isinstance(score_data, dict):
            logger.warning(f"Score non calculé pour {user.username}")
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
                'message': 'Score non calculé - définissez vos valeurs personnelles'
            }, status=200)

        # ✅ FIX 3: Retourner les données correctement
        return Response({
            'total_score': score_data.get('total_score', 0),
            'alignment_score': score_data.get('alignment_score', 0),
            'discipline_score': score_data.get('discipline_score', 0),
            'stability_score': score_data.get('stability_score', 0),
            'improvement_score': score_data.get('improvement_score', 0),
            'score_change': score_data.get('score_change', 0),
            'level': score_data.get('level', 'Débutant'),
            'emoji': score_data.get('emoji', '🌱'),
            'alignment_details': score_data.get('alignment_details', {})
        }, status=200)
        
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
            'emoji': '🌱'
        }, status=500)


# ==========================================
# 2. FIX ai_chat (ligne 1987)
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chat(request):
    """Chat IA avec actions intelligentes (dépenses, revenus, TONTINES)"""
    user = request.user

    try:
        # ✅ FIX 1: Vérifier que la clé API existe
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

        # ✅ FIX 2: Appel API avec gestion d'erreur détaillée
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
