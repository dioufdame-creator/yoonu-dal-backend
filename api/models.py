# api/models.py - Version complète avec tous les modèles nécessaires

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone  # Ajouter si pas déjà là


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

    # ✅✅✅ NOUVEAUX CHAMPS SUBSCRIPTION - AJOUTER ICI ✅✅✅
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

    # ✅✅✅ FIN NOUVEAUX CHAMPS ✅✅✅

    def __str__(self):
        return f"Profil de {self.user.username}"

    # ✅✅✅ NOUVELLES MÉTHODES - AJOUTER ICI ✅✅✅
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
    # ✅✅✅ FIN NOUVELLES MÉTHODES ✅✅✅

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
    period = models.CharField(max_length=10, default='monthly')  # monthly, weekly, yearly
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
            # Par défaut, mois en cours
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
        # Marquer comme atteint si le montant cible est atteint
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
# MODÈLES TONTINES
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

    def next_payment_date(self):
        """Calcule la prochaine date de paiement"""
        if self.status != 'active':
            return None

        today = timezone.now().date()
        if self.frequency == 'monthly':
            if today.day == 1:
                return today
            # Prochain 1er du mois
            if today.month == 12:
                return today.replace(year=today.year + 1, month=1, day=1)
            else:
                return today.replace(month=today.month + 1, day=1)

        return None

    def total_contributions_received(self):
        """Montant total des contributions reçues"""
        return TontineContribution.objects.filter(
            participant__tontine=self,
            is_validated=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0

    def expected_total_contributions(self):
        """Montant total attendu des contributions"""
        return (self.monthly_contribution *
                self.duration_months *
                self.participants.count())

    @property
    def progress_percentage(self):
        """Pourcentage de progression de la tontine"""
        expected = self.expected_total_contributions()
        if expected <= 0:
            return 0
        actual = self.total_contributions_received()
        return min((actual / expected) * 100, 100)

    @property
    def available_spots(self):
        """Nombre de places disponibles"""
        return self.max_participants - self.participants.count()


class TontineParticipant(models.Model):
    """Participants à une tontine"""
    tontine = models.ForeignKey(Tontine, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tontine_participations')
    position = models.IntegerField()  # Ordre de distribution
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
        return self.contributions.filter(is_validated=True).aggregate(
            total=models.Sum('amount')
        )['total'] or 0

    @property
    def expected_contributions(self):
        """Montant total attendu de ce participant"""
        # Calculer selon les mois écoulés depuis le début
        if self.tontine.status != 'active':
            return 0

        today = timezone.now().date()
        months_elapsed = max(0, (today.year - self.tontine.start_date.year) * 12 +
                             today.month - self.tontine.start_date.month)

        return min(months_elapsed, self.tontine.duration_months) * self.tontine.monthly_contribution

    @property
    def contribution_status(self):
        """Statut des contributions: 'up_to_date', 'late', 'ahead'"""
        expected = self.expected_contributions
        actual = self.total_contributions

        if actual >= expected:
            return 'up_to_date'
        elif actual < expected * 0.8:  # Plus de 20% de retard
            return 'late'
        else:
            return 'behind'


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

    def save(self, *args, **kwargs):
        if self.is_validated and not self.validated_at:
            self.validated_at = timezone.now()
        super().save(*args, **kwargs)


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
# SIGNAUX POUR AUTOMATISATION
# ==========================================

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Créer automatiquement un profil pour chaque nouvel utilisateur"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=Saving)
def update_goal_progress(sender, instance, created, **kwargs):
    """Met à jour la progression des objectifs quand une épargne est ajoutée"""
    if created:
        try:
            goal = Goal.objects.get(
                user=instance.user,
                title__icontains=instance.goal
            )
            total_savings = Saving.objects.filter(
                user=instance.user,
                goal=instance.goal
            ).aggregate(total=models.Sum('amount'))['total'] or 0

            goal.current_amount = total_savings
            goal.save()
        except Goal.DoesNotExist:
            pass


@receiver(post_save, sender=TontineContribution)
def update_participant_status(sender, instance, created, **kwargs):
    """Met à jour le statut du participant après une contribution"""
    if instance.is_validated:
        participant = instance.participant
        # Logique pour vérifier si le participant est à jour
        pass


@receiver(post_save, sender=TontineParticipant)
def assign_position(sender, instance, created, **kwargs):
    """Assigner automatiquement une position si pas définie"""
    if created and not instance.position:
        max_position = TontineParticipant.objects.filter(
            tontine=instance.tontine
        ).aggregate(max_pos=models.Max('position'))['max_pos'] or 0

        instance.position = max_position + 1
        instance.save()


# ==========================================
# DIAGNOSTIC ET RECOMMANDATIONS
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


# Ajout à votre models.py existant

class Envelope(models.Model):
    """Système des 3 enveloppes budgétaires - Inspiré du livre"""
    ENVELOPE_TYPES = [
        ('essentiels', 'Essentiels (50%)'),
        ('plaisirs', 'Plaisirs (30%)'),
        ('projets', 'Projets/Épargne (20%)')
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
# SYSTÈME 4 ENVELOPPES YOONU DAL
# ==========================================

class MetaEnvelope(models.Model):
    """
    Système des 4 enveloppes Yoonu Dal
    - Essentiels (besoins de base)
    - Plaisirs (désirs)
    - Projets (investissements dans valeurs)
    - Libération (remboursement dettes)
    """
    ENVELOPE_TYPES = [
        ('essentiels', 'Essentiels'),
        ('plaisirs', 'Plaisirs'),
        ('projets', 'Projets'),
        ('liberation', 'Libération')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meta_envelopes')
    envelope_type = models.CharField(max_length=50, choices=ENVELOPE_TYPES)
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_reset_date = models.DateField(null=True, blank=True)  # ✅ Pour reset mensuel
    
    class Meta:
        unique_together = ('user', 'envelope_type')
        ordering = ['envelope_type']
    
    def __str__(self):
        return f"{self.user.username} - {self.envelope_type}: {self.percentage}%"
    
    @property
    def remaining_budget(self):
        """Budget restant"""
        return max(0, self.monthly_budget - self.current_spent)
    
    @property
    def usage_percentage(self):
        """Pourcentage d'utilisation"""
        if self.monthly_budget <= 0:
            return 0
        return min((self.current_spent / self.monthly_budget) * 100, 100)
    
    @property
    def is_over_budget(self):
        """Dépassement de budget"""
        return self.current_spent > self.monthly_budget

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
    is_plugged = models.BooleanField(default=False)  # Fuite colmatée
    identified_at = models.DateTimeField(auto_now_add=True)
    plugged_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Calculer automatiquement les impacts
        if self.daily_amount:
            self.monthly_impact = self.daily_amount * 30
            self.annual_impact = self.daily_amount * 365
        super().save(*args, **kwargs)

    def __str__(self):
        status = "🔌 Colmatée" if self.is_plugged else "💸 Active"
        return f"{self.user.username} - {self.description}: {self.daily_amount}/jour {status}"


# api/models.py - AJOUTER À LA FIN DU FICHIER (après les modèles existants)

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

    # Action suggérée (JSON)
    suggested_action = models.JSONField(null=True, blank=True)
    # Exemple: {"type": "transfer_budget", "from": "plaisirs", "to": "essentiels", "amount": 15000}

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    is_dismissed = models.BooleanField(default=False)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    action_taken = models.BooleanField(default=False)
    action_taken_at = models.DateTimeField(null=True, blank=True)

    # Contexte de l'alerte (JSON)
    context = models.JSONField(null=True, blank=True)

    # Exemple: {"envelope": "plaisirs", "current_spent": 75000, "budget": 100000, "days_remaining": 5}

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_dismissed']),
            models.Index(fields=['alert_type']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.get_alert_type_display()}: {self.title}"

    def dismiss(self):
        """Marquer l'alerte comme ignorée"""
        self.is_dismissed = True
        self.dismissed_at = timezone.now()
        self.save()

    def mark_action_taken(self):
        """Marquer l'action comme exécutée"""
        self.action_taken = True
        self.action_taken_at = timezone.now()
        self.save()


# api/models.py - AJOUTER à la fin du fichier

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal


class YoonuScore(models.Model):
    """Score Yoonu Dal - Alignement valeurs/finances"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='yoonu_score')

    # Score global
    total_score = models.IntegerField(default=0)  # 0-100

    # Composantes du score
    alignment_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # /35
    discipline_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # /35
    stability_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # /20
    improvement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # /10

    # Détails alignement
    alignment_details = models.JSONField(default=dict, blank=True)
    # Ex: {"famille": 85, "spiritualite": 90, "education": 60}

    # Tracking historique
    previous_score = models.IntegerField(default=0)
    score_change = models.IntegerField(default=0)  # Variation depuis dernier calcul

    # Metadata
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_calculated']

    def __str__(self):
        return f"{self.user.username} - Score: {self.total_score}/100"

    @property
    def score_level(self):
        """Niveau basé sur le score"""
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
        """Emoji basé sur le niveau"""
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
    month = models.DateField()  # Premier jour du mois

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
# MODÈLE PAIEMENT & TRANSACTIONS
# ==========================================

class Transaction(models.Model):
    """Transactions de paiement Premium"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_id = models.CharField(max_length=100, unique=True)
    provider = models.CharField(max_length=20)  # wave, orange, free, card
    phone_number = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    plan = models.CharField(max_length=20)  # monthly, yearly
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

class Debt(models.Model):
    """
    Modèle pour tracker les dettes et remboursements
    Utilisé pour l'enveloppe Libération
    """
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
    
    # Informations de la dette
    name = models.CharField(max_length=200, help_text="Ex: Crédit moto, Prêt oncle")
    debt_type = models.CharField(max_length=50, choices=DEBT_TYPES, default='autre')
    creditor = models.CharField(max_length=200, blank=True, help_text="À qui tu dois")
    
    # Montants
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Dates
    start_date = models.DateField()
    target_end_date = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)
    
    # Intérêts
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Statut
    is_active = models.BooleanField(default=True)
    is_fully_paid = models.BooleanField(default=False)
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Métadonnées
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
        verbose_name = 'Dette'
        verbose_name_plural = 'Dettes'


class DebtPayment(models.Model):
    """
    Historique des remboursements de dette
    """
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
        """Mettre à jour la dette lors d'un paiement"""
        super().save(*args, **kwargs)
        
        # Recalculer le montant payé
        from django.db.models import Sum
        total_paid = self.debt.payments.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        self.debt.amount_paid = total_paid
        
        # Vérifier si entièrement payé
        if self.debt.amount_paid >= self.debt.total_amount:
            self.debt.is_fully_paid = True
            self.debt.is_active = False
            self.debt.actual_end_date = self.payment_date
        
        self.debt.save()
    
    def __str__(self):
        return f"{self.debt.name} - {self.amount} FCFA le {self.payment_date}"
    
    class Meta:
        ordering = ['-payment_date']
