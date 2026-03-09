# api/serializers.py - Version complète avec tous les serializers

from rest_framework import serializers
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

# Import des modèles - CORRIGÉ selon les nouveaux modèles
from .models import (
    UserProfile, UserValue, IncomeSource, Income, Expense, Budget,
    Goal, Saving, Tontine, TontineParticipant, TontineContribution,
    TontinePayout, DiagnosticResult
)


# ==========================================
# SERIALIZERS UTILISATEUR ET AUTHENTIFICATION
# ==========================================

class UserSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le modèle User de base"""

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserProfileSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le profil utilisateur"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            'id', 'user', 'phone_number', 'date_of_birth', 'monthly_income',
            'financial_goals', 'risk_tolerance', 'created_at', 'updated_at','onboarding_completed'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class RegisterSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'inscription des utilisateurs"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


# ==========================================
# SERIALIZERS VALEURS PERSONNELLES
# ==========================================

class UserValueSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les valeurs de l'utilisateur"""

    class Meta:
        model = UserValue
        fields = ('id', 'value', 'priority', 'selected_at')
        read_only_fields = ('id', 'selected_at')


# ==========================================
# SERIALIZERS FINANCIERS
# ==========================================

class IncomeSourceSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les sources de revenus"""

    class Meta:
        model = IncomeSource
        fields = (
            'id', 'source', 'description', 'monthly_amount',
            'is_regular', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class IncomeSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les revenus"""

    class Meta:
        model = Income
        fields = (
            'id', 'source', 'description', 'amount', 'date',
            'is_validated', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class ExpenseSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les dépenses"""

    class Meta:
        model = Expense
        fields = (
            'id', 'category', 'description', 'amount', 'date',
            'is_necessary', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class BudgetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les budgets"""
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = (
            'id', 'category', 'allocated_amount', 'period', 'is_active',
            'spent_amount', 'remaining_amount', 'usage_percentage',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_spent_amount(self, obj):
        return float(obj.get_spent_amount())

    def get_remaining_amount(self, obj):
        return float(obj.remaining_amount)

    def get_usage_percentage(self, obj):
        return obj.usage_percentage


class GoalSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les objectifs financiers"""
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Goal
        fields = (
            'id', 'title', 'description', 'target_amount', 'current_amount',
            'deadline', 'category', 'is_achieved', 'progress_percentage',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class SavingSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les épargnes"""

    class Meta:
        model = Saving
        fields = (
            'id', 'amount', 'goal', 'description', 'date',
            'account_type', 'is_available', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


# ==========================================
# SERIALIZERS TONTINES
# ==========================================

class TontineParticipantSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les participants aux tontines"""
    user_details = UserSerializer(source='user', read_only=True)
    total_contributions = serializers.ReadOnlyField()
    expected_contributions = serializers.ReadOnlyField()
    contribution_status = serializers.ReadOnlyField()

    class Meta:
        model = TontineParticipant
        fields = (
            'id', 'user', 'user_details', 'position', 'joined_at',
            'is_admin', 'is_active', 'received_payout', 'payout_date',
            'payout_amount', 'total_contributions', 'expected_contributions',
            'contribution_status'
        )
        read_only_fields = ('id', 'joined_at')


class TontineContributionSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les contributions de tontine"""
    participant_name = serializers.CharField(source='participant.user.username', read_only=True)
    tontine_name = serializers.CharField(source='participant.tontine.name', read_only=True)

    class Meta:
        model = TontineContribution
        fields = (
            'id', 'participant', 'participant_name', 'tontine_name',
            'amount', 'date', 'is_validated', 'validated_by', 'validated_at',
            'payment_method', 'transaction_reference', 'notes', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'validated_at')


class TontineSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les tontines"""
    creator_details = UserSerializer(source='creator', read_only=True)
    participants_count = serializers.SerializerMethodField()
    total_contributions_received = serializers.SerializerMethodField()
    expected_total_contributions = serializers.SerializerMethodField()
    progress_percentage = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    next_payment_date = serializers.SerializerMethodField()

    class Meta:
        model = Tontine
        fields = (
            'id', 'name', 'description', 'creator', 'creator_details',
            'total_amount', 'monthly_contribution', 'max_participants',
            'participants_count', 'duration_months', 'frequency',
            'start_date', 'end_date', 'status', 'rules', 'is_private',
            'invitation_code', 'total_contributions_received',
            'expected_total_contributions', 'progress_percentage',
            'available_spots', 'next_payment_date', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'creator', 'invitation_code', 'created_at', 'updated_at')

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_total_contributions_received(self, obj):
        return float(obj.total_contributions_received())

    def get_expected_total_contributions(self, obj):
        return float(obj.expected_total_contributions())

    def get_next_payment_date(self, obj):
        next_date = obj.next_payment_date()
        return next_date.isoformat() if next_date else None

    def validate(self, data):
        """Validation des données de tontine"""
        if data.get('max_participants', 0) < 2:
            raise serializers.ValidationError(
                "Une tontine doit avoir au minimum 2 participants"
            )

        if data.get('monthly_contribution', 0) <= 0:
            raise serializers.ValidationError(
                "Le montant de contribution doit être positif"
            )

        if data.get('duration_months', 0) <= 0:
            raise serializers.ValidationError(
                "La durée doit être positive"
            )

        return data


class TontineDetailSerializer(TontineSerializer):
    """Sérialiseur détaillé pour une tontine spécifique"""
    participants = TontineParticipantSerializer(many=True, read_only=True)
    recent_contributions = serializers.SerializerMethodField()

    class Meta(TontineSerializer.Meta):
        fields = TontineSerializer.Meta.fields + ('participants', 'recent_contributions')

    def get_recent_contributions(self, obj):
        recent_contributions = TontineContribution.objects.filter(
            participant__tontine=obj
        ).order_by('-date')[:10]
        return TontineContributionSerializer(recent_contributions, many=True).data


class TontinePayoutSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les versements aux participants"""
    recipient_name = serializers.CharField(source='recipient.user.username', read_only=True)
    tontine_name = serializers.CharField(source='tontine.name', read_only=True)

    class Meta:
        model = TontinePayout
        fields = (
            'id', 'tontine', 'tontine_name', 'recipient', 'recipient_name',
            'amount', 'date', 'is_processed', 'processed_by', 'processed_at',
            'transaction_reference', 'notes', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'processed_at')


# ==========================================
# SERIALIZERS SIMULATEUR TONTINE
# ==========================================

class TontineSimulatorSerializer(serializers.Serializer):
    """Sérialiseur pour le simulateur de tontine"""
    amount_per_contribution = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1000)
    frequency = serializers.ChoiceField(choices=[
        ('weekly', 'Hebdomadaire'),
        ('biweekly', 'Bi-hebdomadaire'),
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel')
    ])
    number_of_participants = serializers.IntegerField(min_value=2, max_value=100)
    desired_position = serializers.IntegerField(min_value=1)

    def validate(self, data):
        """Validation des données de simulation"""
        if data['desired_position'] > data['number_of_participants']:
            raise serializers.ValidationError(
                "La position désirée ne peut pas être supérieure au nombre de participants"
            )
        return data

    def to_representation(self, instance):
        """Calcul des résultats de simulation"""
        data = super().to_representation(instance)

        # Calculs de base
        amount = Decimal(str(data['amount_per_contribution']))
        participants = data['number_of_participants']
        position = data['desired_position']
        frequency = data['frequency']

        # Montant total du cycle
        total_cycle_amount = amount * participants

        # Fréquence de contribution en jours
        frequency_days = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30,
            'quarterly': 90
        }

        cycle_duration_days = frequency_days[frequency] * participants
        reception_date = timezone.now().date() + timedelta(days=frequency_days[frequency] * position)

        # Calculs financiers
        total_contributed = amount * position
        net_gain = total_cycle_amount - total_contributed
        roi_percentage = (net_gain / total_contributed * 100) if total_contributed > 0 else 0

        # Équivalent mensuel
        monthly_multiplier = {
            'weekly': Decimal('4.33'),
            'biweekly': Decimal('2.17'),
            'monthly': Decimal('1'),
            'quarterly': Decimal('0.33')
        }
        monthly_contribution = amount * monthly_multiplier[frequency]

        # Analyse de rentabilité
        is_beneficial = position <= participants / 2

        # Score de risque (basé sur la position)
        risk_score = (position / participants) * 100

        data.update({
            'results': {
                'total_cycle_amount': float(total_cycle_amount),
                'total_contributed': float(total_contributed),
                'net_gain': float(net_gain),
                'roi_percentage': round(float(roi_percentage), 2),
                'monthly_contribution': float(monthly_contribution),
                'expected_reception_date': reception_date.isoformat(),
                'cycle_duration_days': cycle_duration_days,
                'is_beneficial': is_beneficial,
                'risk_score': round(risk_score, 1),
                'recommendation': self._get_recommendation(position, participants, roi_percentage)
            }
        })

        return data

    def _get_recommendation(self, position, participants, roi):
        """Génère une recommandation basée sur la simulation"""
        if position <= participants * 0.3:
            return {
                'level': 'excellent',
                'message': 'Position très avantageuse ! Vous recevrez tôt avec un excellent retour sur investissement.',
                'advice': 'Cette position est idéale pour financer un projet urgent ou profiter d\'un effet de levier.',
                'icon': '🎯'
            }
        elif position <= participants * 0.5:
            return {
                'level': 'good',
                'message': 'Bonne position avec un retour positif sur votre investissement.',
                'advice': 'Position équilibrée entre avantage financier et délai d\'attente raisonnable.',
                'icon': '👍'
            }
        elif position <= participants * 0.7:
            return {
                'level': 'neutral',
                'message': 'Position neutre - vous contribuez plus que vous ne recevez immédiatement.',
                'advice': 'Convient si votre objectif principal est l\'épargne forcée plutôt que le gain financier.',
                'icon': '⚖️'
            }
        else:
            return {
                'level': 'warning',
                'message': 'Position tardive - retour sur investissement négatif mais excellente discipline d\'épargne.',
                'advice': 'Recommandé uniquement si vous recherchez un mécanisme d\'épargne forcée à long terme.',
                'icon': '⚠️'
            }


# ==========================================
# SERIALIZERS DIAGNOSTIC
# ==========================================

class DiagnosticResultSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les résultats du diagnostic"""

    class Meta:
        model = DiagnosticResult
        fields = (
            'id', 'user', 'financial_health_score', 'savings_capacity_score',
            'planning_score', 'risk_management_score', 'overall_score',
            'recommendations', 'completed_at'
        )
        read_only_fields = ('id', 'user', 'completed_at')


# ==========================================
# SERIALIZERS DASHBOARD
# ==========================================

class DashboardMetricsSerializer(serializers.Serializer):
    """Sérialiseur pour les métriques du dashboard"""
    monthly_income = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_savings = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    active_tontines = serializers.IntegerField(read_only=True)
    financial_health_score = serializers.FloatField(read_only=True)
    savings_rate = serializers.FloatField(read_only=True)
    expense_ratio = serializers.FloatField(read_only=True)
    tontine_participation = serializers.FloatField(read_only=True)
    period = serializers.CharField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)


class AlignmentDataSerializer(serializers.Serializer):
    """Sérialiseur pour les données d'alignement Yoonu Dal"""
    revenue_score = serializers.FloatField(read_only=True)
    expense_score = serializers.FloatField(read_only=True)
    values_score = serializers.FloatField(read_only=True)
    overall_alignment = serializers.FloatField(read_only=True)
    recommendations = serializers.ListField(child=serializers.CharField(), read_only=True)
    calculation_date = serializers.DateTimeField(read_only=True)


class TransactionSerializer(serializers.Serializer):
    """Sérialiseur pour les transactions récentes"""
    id = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    type = serializers.CharField(read_only=True)
    category = serializers.CharField(read_only=True)
    date = serializers.DateField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class BudgetOverviewSerializer(serializers.Serializer):
    """Sérialiseur pour la vue d'ensemble du budget"""
    categories = serializers.ListField(read_only=True)
    total_allocated = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_spent = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_budget = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    period = serializers.CharField(read_only=True)
    month = serializers.DateTimeField(read_only=True)


# ==========================================
# SERIALIZERS ANALYSIS
# ==========================================

class TontineAnalysisSerializer(serializers.Serializer):
    """Sérialiseur pour l'analyse des tontines"""
    total_monthly_commitment = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    budget_impact_percentage = serializers.FloatField(read_only=True)
    number_of_active_tontines = serializers.IntegerField(read_only=True)
    diversification_score = serializers.FloatField(read_only=True)
    risk_score = serializers.FloatField(read_only=True)
    efficiency_score = serializers.FloatField(read_only=True)
    primary_motivation = serializers.CharField(read_only=True)
    recommendations = serializers.ListField(child=serializers.CharField(), read_only=True)
    next_reception_date = serializers.DateField(read_only=True)
    next_reception_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    motivations_breakdown = serializers.DictField(read_only=True)
    alternatives_suggested = serializers.ListField(child=serializers.CharField(), read_only=True)


# ==========================================
# SERIALIZERS STATISTIQUES
# ==========================================

class StatisticsSerializer(serializers.Serializer):
    """Sérialiseur pour les statistiques générales"""
    period = serializers.CharField(read_only=True)
    total_income = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_savings = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    expense_by_category = serializers.DictField(read_only=True)
    income_by_source = serializers.DictField(read_only=True)
    monthly_trend = serializers.ListField(read_only=True)
    goals_progress = serializers.ListField(read_only=True)


# ==========================================
# SERIALIZERS DE VALIDATION
# ==========================================

class ValidationErrorSerializer(serializers.Serializer):
    """Sérialiseur pour les erreurs de validation"""
    field = serializers.CharField()
    message = serializers.CharField()
    code = serializers.CharField(required=False)


class ResponseSerializer(serializers.Serializer):
    """Sérialiseur générique pour les réponses API"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(required=False)
    data = serializers.DictField(required=False)
    errors = ValidationErrorSerializer(many=True, required=False)