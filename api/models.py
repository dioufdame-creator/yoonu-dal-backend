# api/models.py - Version complète avec tous les modèles nécessaires

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


# ==========================================
# MODÈLES DE BASE
# ==========================================

class UserProfile(models.Model):
    """Profil utilisateur étendu"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    monthly_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    financial_goals = models.TextField(blank=True, null=True)
    risk_tolerance = models.CharField(
        max_length=20,
        choices=[('low', 'Faible'), ('medium', 'Moyen'), ('high', 'Élevé')],
        default='medium'
    )
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ✅ CHAMPS SUBSCRIPTION
    subscription_tier = models.CharField(
        max_length=20,
        choices=[('free', 'Freemium'), ('premium', 'Premium')],
        default='free'
    )
    subscription_expires_at = models.DateTimeField(null=True, blank=True)

    trial_active = models.BooleanField(default=False)
    trial_started_at = models.DateTimeField(null=True, blank=True)
    trial_expires_at = models.DateTimeField(null=True, blank=True)
    trial_used = models.BooleanField(default=False)

    ai_messages_count = models.IntegerField(default=0)
    ai_messages_reset_date = models.DateField(default=timezone.now)

    payment_method = models.CharField(max_length=50, blank=True)
    last_payment_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profil de {self.user.username}"

    def is_premium_active(self):
        """Vérifie si user a accès Premium"""
        if self.subscription_tier == 'premium':
            if self.subscription_expires_at and self.subscription_expires_at > timezone.now():
                return True

        if self.trial_active:
            if self.trial_expires_at and self.trial_expires_at > timezone.now():
                return True
            else:
                self.trial_active = False
                self.save()

        return False

    def start_trial(self):
        """Démarre l'essai gratuit 30 jours"""
        if self.trial_used:
            return False

        self.trial_active = True
        self.trial_started_at = timezone.now()
        self.trial_expires_at = timezone.now() + timedelta(days=30)
        self.trial_used = True
        self.save()
        return True

    def trial_days_remaining(self):
        """Jours restants du trial"""
        if not self.trial_active or not self.trial_expires_at:
            return 0
        delta = self.trial_expires_at - timezone.now()
        return max(0, delta.days)

    def reset_monthly_limits(self):
        """Reset compteurs mensuels"""
        from dateutil.relativedelta import relativedelta
        today = timezone.now().date()
        if self.ai_messages_reset_date < today:
            next_reset = (today.replace(day=1) + relativedelta(months=1))
            self.ai_messages_count = 0
            self.ai_messages_reset_date = next_reset
            self.save()


# ==========================================
# VALEURS UTILISATEUR
# ==========================================

class UserValue(models.Model):
    """Valeurs personnelles sélectionnées par l'utilisateur"""
    VALUE_CHOICES = [
        ('famille', 'Famille'),
        ('spiritualite', 'Spiritualité'),
        ('education', 'Éducation'),
        ('sante', 'Santé'),
        ('travail', 'Travail'),
        ('loisirs', 'Loisirs'),
        ('communaute', 'Communauté'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_values')
    value = models.CharField(max_length=20, choices=VALUE_CHOICES)
    priority = models.IntegerField(choices=[(i, i) for i in range(1, 8)])
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'value')
        ordering = ['priority']

    def __str__(self):
        return f"{self.user.username} - {self.get_value_display()} (priorité {self.priority})"


# ==========================================
# MODÈLES FINANCIERS
# ==========================================

class IncomeSource(models.Model):
    """Sources de revenus"""
    SOURCE_CHOICES = [
        ('salaire', 'Salaire'),
        ('business', 'Business'),
        ('investissement', 'Investissement'),
        ('freelance', 'Freelance'),
        ('location', 'Location'),
        ('autre', 'Autre'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='income_sources')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    description = models.CharField(max_length=200)
    monthly_amount = models.DecimalField(max_digits=15, decimal_places=2)
    is_regular = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.source}: {self.monthly_amount}"


class Income(models.Model):
    """Revenus enregistrés"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    source = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField(default=timezone.now)
    is_validated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.source}: {self.amount}"


class Expense(models.Model):
    """Dépenses"""
    CATEGORY_CHOICES = [
        ('alimentation', 'Alimentation'),
        ('transport', 'Transport'),
        ('logement', 'Logement'),
        ('loisirs', 'Loisirs'),
        ('santé', 'Santé'),
        ('éducation', 'Éducation'),
        ('vêtements', 'Vêtements'),
        ('famille', 'Famille'),
        ('spiritualité', 'Spiritualité'),
        ('dettes', 'Dettes & Remboursements'),  # ✅ NOUVEAU
        ('autre', 'Autre'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField(default=timezone.now)
    is_necessary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.category}: {self.amount}"


class Budget(models.Model):
    """Budget par catégorie pour chaque utilisateur"""
    CATEGORY_CHOICES = Expense.CATEGORY_CHOICES

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    allocated_amount = models.DecimalField(max_digits=15, decimal_places=2)
    period = models.CharField(max_length=10, default='monthly')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category')
        ordering = ['category']

    def __str__(self):
        return f"{self.user.username} - {self.category}: {self.allocated_amount}"

    def get_spent_amount(self, period_start=None):
        """Calcule le montant dépensé dans cette catégorie pour la période"""
        if not period_start:
            period_start = timezone.now().replace(day=1)

        return Expense.objects.filter(
            user=self.user,
            category=self.category,
            date__gte=period_start
        ).aggregate(total=models.Sum('amount'))['total'] or 0

    @property
    def remaining_amount(self):
        spent = self.get_spent_amount()
        return self.allocated_amount - spent

    @property
    def usage_percentage(self):
        spent = self.get_spent_amount()
        if self.allocated_amount <= 0:
            return 0
        return (spent / self.allocated_amount) * 100


class Goal(models.Model):
    """Objectifs financiers de l'utilisateur"""
    CATEGORY_CHOICES = [
        ('urgence', 'Fonds d\'urgence'),
        ('transport', 'Transport'),
        ('logement', 'Logement'),
        ('loisirs', 'Loisirs'),
        ('éducation', 'Éducation'),
        ('santé', 'Santé'),
        ('investissement', 'Investissement'),
        ('retraite', 'Retraite'),
        ('autre', 'Autre'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='autre')
    is_achieved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    @property
    def progress_percentage(self):
        if self.target_amount <= 0:
            return 0
        return min((self.current_amount / self.target_amount) * 100, 100)

    def save(self, *args, **kwargs):
        if self.current_amount >= self.target_amount:
            self.is_achieved = True
        super().save(*args, **kwargs)



class Saving(models.Model):
    """Épargnes personnelles de l'utilisateur"""
    GOAL_CHOICES = [
        ('urgence', 'Fonds d\'urgence'),
        ('projet', 'Projet personnel'),
        ('retraite', 'Retraite'),
        ('investissement', 'Investissement'),
        ('voyage', 'Voyage'),
        ('achat', 'Achat important'),
        ('autre', 'Autre'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='savings')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES)
    description = models.CharField(max_length=200, blank=True, null=True)
    date = models.DateField(default=timezone.now)
    account_type = models.CharField(max_length=50, default='compte_epargne')
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.goal}: {self.amount}"


# ==========================================
# SYSTÈME DES 4 ENVELOPPES - CORRIGÉ
# ==========================================

class Envelope(models.Model):
    """Système des 4 enveloppes budgétaires - Inspiré du livre"""
    
    ENVELOPE_TYPES = [
        ('essentiels', 'Essentiels'),
        ('plaisirs', 'Plaisirs'),
        ('projets', 'Projets'),
        ('liberation', 'Libération'),
        # Sous-catégories
        ('alimentation', 'Alimentation'),
        ('transport', 'Transport'),
        ('logement', 'Logement'),
        ('sante', 'Santé'),
        ('loisirs', 'Loisirs'),
        ('vetements', 'Vêtements'),
        ('education', 'Éducation'),
        ('famille', 'Famille'),
        ('spiritualite', 'Spiritualité'),
        ('dettes', 'Dettes'),
        ('autre', 'Autre')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='envelopes')
    envelope_type = models.CharField(max_length=20, choices=ENVELOPE_TYPES)
    allocated_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    monthly_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_meta_envelope = models.BooleanField(default=False)
    parent_envelope_type = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    last_reset_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'envelope_type')
        ordering = ['envelope_type']

    def __str__(self):
        return f"{self.user.username} - {self.envelope_type}: {self.allocated_percentage}%"

    @property
    def remaining_budget(self):
        """Budget restant dans cette enveloppe"""
        return max(0, self.monthly_budget - self.current_spent)

    @property
    def usage_percentage(self):
        """Pourcentage d'utilisation de l'enveloppe"""
        if self.monthly_budget <= 0:
            return 0
        return min((self.current_spent / self.monthly_budget) * 100, 100)

    @property
    def status(self):
        """Statut de l'enveloppe : good, warning, danger"""
        usage = self.usage_percentage
        if usage <= 70:
            return 'good'
        elif usage <= 90:
            return 'warning'
        else:
            return 'danger'

    def calculate_monthly_budget(self, monthly_income):
        """Calcule le budget mensuel basé sur le pourcentage et le revenu"""
        if monthly_income > 0:
            self.monthly_budget = (self.allocated_percentage / 100) * monthly_income
            self.save()
        return self.monthly_budget

    def reset_monthly_spent(self):
        """Remet à zéro les dépenses du mois (à appeler en début de mois)"""
        self.current_spent = 0
        self.save()


# ==========================================
# FUITES FINANCIÈRES
# ==========================================

class FinancialLeak(models.Model):
    """Petites fuites financières identifiées"""
    LEAK_CATEGORIES = [
        ('abonnements', 'Abonnements oubliés'),
        ('snacks', 'Snacks quotidiens'),
        ('transport', 'Transport non optimisé'),
        ('telecoms', 'Frais télécoms excessifs'),
        ('autre', 'Autre')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='financial_leaks')
    category = models.CharField(max_length=20, choices=LEAK_CATEGORIES)
    description = models.CharField(max_length=200)
    daily_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monthly_impact = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    annual_impact = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_plugged = models.BooleanField(default=False)
    identified_at = models.DateTimeField(auto_now_add=True)
    plugged_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.daily_amount:
            self.monthly_impact = self.daily_amount * 30
            self.annual_impact = self.daily_amount * 365
        super().save(*args, **kwargs)

    def __str__(self):
        status = "🔌 Colmatée" if self.is_plugged else "💸 Active"
        return f"{self.user.username} - {self.description}: {self.daily_amount}/jour {status}"


# ==========================================
# ALERTES PRÉDICTIVES
# ==========================================

class PredictiveAlert(models.Model):
    """Alertes prédictives générées par l'IA"""
    ALERT_TYPES = [
        ('budget_warning', 'Alerte budget'),
        ('upcoming_payment', 'Échéance à venir'),
        ('tontine_due', 'Contribution tontine'),
        ('habit_warning', 'Habitude détectée'),
        ('cultural_event', 'Événement culturel'),
    ]

    SEVERITY_LEVELS = [
        ('info', 'Information'),
        ('warning', 'Avertissement'),
        ('critical', 'Critique'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predictive_alerts')
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='warning')
    title = models.CharField(max_length=200)
    message = models.TextField()
    suggested_action = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_dismissed = models.BooleanField(default=False)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    action_taken = models.BooleanField(default=False)
    action_taken_at = models.DateTimeField(null=True, blank=True)
    context = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_dismissed']),
            models.Index(fields=['alert_type']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.get_alert_type_display()}: {self.title}"

    def dismiss(self):
        self.is_dismissed = True
        self.dismissed_at = timezone.now()
        self.save()

    def mark_action_taken(self):
        self.action_taken = True
        self.action_taken_at = timezone.now()
        self.save()


# ==========================================
# SCORE YOONU
# ==========================================

class YoonuScore(models.Model):
    """Score Yoonu Dal - Alignement valeurs/finances"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='yoonu_score')
    total_score = models.IntegerField(default=0)
    alignment_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discipline_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    stability_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    improvement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    alignment_details = models.JSONField(default=dict, blank=True)
    previous_score = models.IntegerField(default=0)
    score_change = models.IntegerField(default=0)
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_calculated']

    def __str__(self):
        return f"{self.user.username} - Score: {self.total_score}/100"

    @property
    def score_level(self):
        if self.total_score >= 81:
            return "Maître Yoonu"
        elif self.total_score >= 61:
            return "Aligné"
        elif self.total_score >= 41:
            return "En chemin"
        else:
            return "Débutant"

    @property
    def score_emoji(self):
        if self.total_score >= 81:
            return "🏆"
        elif self.total_score >= 61:
            return "🌳"
        elif self.total_score >= 41:
            return "🌿"
        else:
            return "🌱"


class ScoreHistory(models.Model):
    """Historique mensuel des scores"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='score_history')
    month = models.DateField()
    total_score = models.IntegerField()
    alignment_score = models.DecimalField(max_digits=5, decimal_places=2)
    discipline_score = models.DecimalField(max_digits=5, decimal_places=2)
    stability_score = models.DecimalField(max_digits=5, decimal_places=2)
    improvement_score = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-month']
        unique_together = ('user', 'month')

    def __str__(self):
        return f"{self.user.username} - {self.month.strftime('%B %Y')}: {self.total_score}/100"


# ==========================================
# PAIEMENTS & TRANSACTIONS
# ==========================================

class Transaction(models.Model):
    """Transactions de paiement Premium"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_id = models.CharField(max_length=100, unique=True)
    provider = models.CharField(max_length=20)
    phone_number = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    plan = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'En attente'),
            ('completed', 'Complété'),
            ('failed', 'Échoué')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.amount} FCFA - {self.status}"


# ==========================================
# DETTES (ENVELOPPE LIBÉRATION)
# ==========================================

class Debt(models.Model):
    """Tracker les dettes et remboursements"""
    DEBT_TYPES = [
        ('credit_bancaire', 'Crédit bancaire'),
        ('pret_personnel', 'Prêt personnel'),
        ('dette_famille', 'Dette familiale'),
        ('dette_ami', 'Dette à un ami'),
        ('credit_commerce', 'Crédit commerce'),
        ('tontine', 'Tontine'),
        ('autre', 'Autre')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    name = models.CharField(max_length=200)
    debt_type = models.CharField(max_length=50, choices=DEBT_TYPES, default='autre')
    creditor = models.CharField(max_length=200, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    target_end_date = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    is_fully_paid = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def remaining_amount(self):
        return self.total_amount - self.amount_paid
    
    @property
    def progress_percentage(self):
        if self.total_amount > 0:
            return (self.amount_paid / self.total_amount) * 100
        return 0
    
    @property
    def months_remaining(self):
        if self.monthly_payment > 0 and self.remaining_amount > 0:
            return int(self.remaining_amount / self.monthly_payment) + 1
        return 0
    
    @property
    def status(self):
        if self.is_fully_paid:
            return 'paid'
        elif self.progress_percentage >= 75:
            return 'almost_done'
        elif self.progress_percentage >= 50:
            return 'halfway'
        elif self.progress_percentage >= 25:
            return 'in_progress'
        else:
            return 'started'
    
    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.remaining_amount} FCFA restants)"
    
    class Meta:
        ordering = ['-is_active', '-created_at']


class DebtPayment(models.Model):
    """Historique des remboursements de dette"""
    PAYMENT_METHODS = [
        ('cash', 'Espèces'),
        ('virement', 'Virement'),
        ('mobile_money', 'Mobile Money'),
        ('cheque', 'Chèque'),
        ('autre', 'Autre')
    ]
    
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='cash')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
        # Recalculer le montant payé
        from django.db.models import Sum
        total_paid = self.debt.payments.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
    
        self.debt.amount_paid = total_paid
    
        if self.debt.amount_paid >= self.debt.total_amount:
            self.debt.is_fully_paid = True
            self.debt.is_active = False
            self.debt.actual_end_date = self.payment_date
    
        self.debt.save()
    
    def __str__(self):
        return f"{self.debt.name} - {self.amount} FCFA le {self.payment_date}"
    
    class Meta:
        ordering = ['-payment_date']


# ==========================================
# DIAGNOSTIC
# ==========================================

class DiagnosticResult(models.Model):
    """Résultats du diagnostic financier"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diagnostic_results')
    financial_health_score = models.IntegerField()
    savings_capacity_score = models.IntegerField()
    planning_score = models.IntegerField()
    risk_management_score = models.IntegerField()
    overall_score = models.IntegerField()
    recommendations = models.JSONField(default=dict)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"Diagnostic {self.user.username} - Score: {self.overall_score}/100"


# ==========================================
# TONTINES (modèles complets conservés)
# ==========================================

class Tontine(models.Model):
    """Tontine principale"""
    STATUS_CHOICES = [
        ('planning', 'En planification'),
        ('active', 'Active'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]

    FREQUENCY_CHOICES = [
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuelle'),
        ('quarterly', 'Trimestrielle'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tontines')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    monthly_contribution = models.DecimalField(max_digits=15, decimal_places=2)
    max_participants = models.IntegerField()
    duration_months = models.IntegerField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    rules = models.TextField(blank=True, null=True)
    is_private = models.BooleanField(default=False)
    invitation_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.invitation_code:
            import random
            import string
            self.invitation_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)

    @property
    def available_spots(self):
        """Nombre de places disponibles"""
        return self.max_participants - self.participants.count()

    @property
    def progress_percentage(self):
        """Pourcentage de remplissage des participants"""
        if self.max_participants == 0:
            return 0
        return (self.participants.count() / self.max_participants) * 100

    def next_payment_date(self):
        """Date du prochain paiement"""
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        
        if self.status != 'active':
            return None
        
        # Calculer le prochain paiement en fonction de la date de début
        if self.frequency == 'monthly':
            # Trouver le mois suivant
            today = datetime.now().date()
            next_date = self.start_date
            while next_date <= today:
                next_date = next_date + relativedelta(months=1)
            return next_date
        
        return None

    def total_contributions_received(self):
        """Total des contributions reçues"""
        from django.db.models import Sum
        # Récupérer le modèle TontineContribution depuis apps
        from django.apps import apps
        TontineContribution = apps.get_model('api', 'TontineContribution')
        
        total = TontineContribution.objects.filter(
            participant__tontine=self  # ✅
        ).aggregate(total=Sum('amount'))['total']
        return total or 0


class TontineParticipant(models.Model):
    """Participants à une tontine"""
    tontine = models.ForeignKey(Tontine, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tontine_participations')
    position = models.IntegerField()
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    received_payout = models.BooleanField(default=False)
    payout_date = models.DateField(null=True, blank=True)
    payout_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    payout_position = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('tontine', 'user')
        ordering = ['position']

    def __str__(self):
        return f"{self.user.username} dans {self.tontine.name} (pos. {self.position})"

    @property
    def total_contributions(self):
        """Total des contributions versées par ce participant"""
        from django.db.models import Sum
        from django.apps import apps
        TontineContribution = apps.get_model('api', 'TontineContribution')
        
        total = TontineContribution.objects.filter(
            participant=self
        ).aggregate(total=Sum('amount'))['total']
        return total or 0

    @property
    def contribution_status(self):
        """Statut des contributions (à jour, en retard, etc.)"""
        from decimal import Decimal
        
        expected = self.tontine.monthly_contribution  # Decimal
        actual = Decimal(str(self.total_contributions))  # Convertir en Decimal
        
        if actual >= expected:
            return 'à_jour'
        elif actual >= expected * Decimal('0.5'):  # Decimal * Decimal
            return 'partiel'
        else:
            return 'en_retard'


class TontineContribution(models.Model):
    """Contributions versées dans les tontines"""
    participant = models.ForeignKey(TontineParticipant, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField(default=timezone.now)
    is_validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='validated_contributions')
    validated_at = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, default='virement')
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.participant.user.username} - {self.participant.tontine.name}: {self.amount}"


class TontinePayout(models.Model):
    """Versements aux participants"""
    tontine = models.ForeignKey(Tontine, on_delete=models.CASCADE, related_name='payouts')
    recipient = models.ForeignKey(TontineParticipant, on_delete=models.CASCADE, related_name='received_payouts')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    is_processed = models.BooleanField(default=False)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Paiement à {self.recipient.user.username} - {self.tontine.name}: {self.amount}"


# ==========================================
# SIGNAUX
# ==========================================

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=Saving)
def update_goal_progress(sender, instance, created, **kwargs):
    if created:
        try:
            goal = Goal.objects.get(user=instance.user, title__icontains=instance.goal)
            total_savings = Saving.objects.filter(
                user=instance.user, goal=instance.goal
            ).aggregate(total=models.Sum('amount'))['total'] or 0
            goal.current_amount = total_savings
            goal.save()
        except Goal.DoesNotExist:
            pass


@receiver(post_save, sender=TontineParticipant)
def assign_position(sender, instance, created, **kwargs):
    if created and not instance.position:
        max_position = TontineParticipant.objects.filter(
            tontine=instance.tontine
        ).aggregate(max_pos=models.Max('position'))['max_pos'] or 0
        instance.position = max_position + 1
        instance.save()


# ==========================================
# PHASE 2 - GOALS
# ==========================================

class GoalContribution(models.Model):
    """Historique des contributions à un objectif"""
    
    TYPE_CHOICES = [
        ('add', 'Ajout'),
        ('remove', 'Retrait'),
        ('auto', 'Auto-allocation'),
    ]
    
    goal = models.ForeignKey('Goal', on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    contribution_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='add')
    source = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.goal.title} - {self.get_contribution_type_display()}: {self.amount}"


class GoalAutoAllocation(models.Model):
    """Configuration auto-allocation enveloppe → objectif"""
    
    goal = models.ForeignKey('Goal', on_delete=models.CASCADE, related_name='auto_allocations')
    envelope = models.ForeignKey('Envelope', on_delete=models.CASCADE, related_name='goal_allocations')
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('goal', 'envelope')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.goal.title} ← {self.percentage}% de {self.envelope.category}"


class GoalMilestone(models.Model):
    """Jalons atteints pour gamification"""
    
    MILESTONE_CHOICES = [
        ('25', '25% atteint'),
        ('50', '50% atteint'),
        ('75', '75% atteint'),
        ('100', '100% atteint'),
        ('first_contribution', 'Première contribution'),
    ]
    
    goal = models.ForeignKey('Goal', on_delete=models.CASCADE, related_name='milestones')
    milestone_type = models.CharField(max_length=20, choices=MILESTONE_CHOICES)
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('goal', 'milestone_type')
        ordering = ['-unlocked_at']
    
    def __str__(self):
        return f"{self.goal.title} - {self.get_milestone_type_display()}"
