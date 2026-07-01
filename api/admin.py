# api/admin.py - Configuration admin complète pour Yoonu Dal

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Sum, Count
from django.utils import timezone

from .models import (
    UserProfile, UserValue, IncomeSource, Income, Expense, Budget,
    Goal, Saving, Tontine, TontineParticipant, TontineContribution,
    TontinePayout, DiagnosticResult
)


# ==========================================
# CONFIGURATION ADMIN UTILISATEURS
# ==========================================

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'phone_number', 'monthly_income',
        'subscription_tier', 'premium_status_display',
        'trial_active', 'trial_days_remaining_display',
        'subscription_expires_display', 'created_at'
    )
    list_filter = ('subscription_tier', 'trial_active', 'risk_tolerance', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone_number')
    readonly_fields = ('created_at', 'updated_at', 'premium_status_display', 'trial_days_remaining_display')

    fieldsets = (
        ('Informations utilisateur', {
            'fields': ('user',)
        }),
        ('Informations personnelles', {
            'fields': ('phone_number', 'date_of_birth')
        }),
        ('Informations financières', {
            'fields': ('monthly_income', 'financial_goals', 'risk_tolerance')
        }),
        ('✅ Abonnement & Premium', {
            'fields': (
                'subscription_tier',
                'subscription_expires_at',
                'trial_active',
                'trial_started_at',
                'trial_expires_at',
                'trial_used',
                'premium_status_display',
                'trial_days_remaining_display',
            )
        }),
        ('IA & Usage', {
            'fields': ('ai_messages_count', 'ai_messages_reset_date'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def premium_status_display(self, obj):
        active = obj.is_premium_active()
        if active:
            if obj.subscription_tier == 'premium':
                return format_html('<span style="color:green;font-weight:bold;">✅ Premium</span>')
            else:
                return format_html('<span style="color:orange;font-weight:bold;">🔶 Trial actif</span>')
        return format_html('<span style="color:gray;">❌ Free</span>')
    premium_status_display.short_description = 'Statut Premium'

    def trial_days_remaining_display(self, obj):
        days = obj.trial_days_remaining()
        if days > 0:
            return format_html('<span style="color:orange;">{} jours restants</span>', days)
        return format_html('<span style="color:gray;">—</span>')
    trial_days_remaining_display.short_description = 'Trial restant'

    def subscription_expires_display(self, obj):
        if obj.subscription_expires_at:
            expired = obj.subscription_expires_at < timezone.now()
            color = 'red' if expired else 'green'
            label = '(expiré)' if expired else ''
            return format_html(
                '<span style="color:{};">{} {}</span>',
                color,
                obj.subscription_expires_at.strftime('%d/%m/%Y'),
                label
            )
        return format_html('<span style="color:gray;">—</span>')
    subscription_expires_display.short_description = 'Expire le'

    # ── Actions rapides premium ──────────────────────────────
    actions = ['activate_premium_1_year', 'activate_premium_1_month', 'revoke_premium', 'start_trial_30']

    def activate_premium_1_year(self, request, queryset):
        from datetime import timedelta
        updated = 0
        for profile in queryset:
            profile.subscription_tier = 'premium'
            profile.subscription_expires_at = timezone.now() + timedelta(days=365)
            profile.save()
            updated += 1
        self.message_user(request, f'✅ {updated} profil(s) mis en Premium 1 an.')
    activate_premium_1_year.short_description = '✅ Activer Premium 1 an'

    def activate_premium_1_month(self, request, queryset):
        from datetime import timedelta
        updated = 0
        for profile in queryset:
            profile.subscription_tier = 'premium'
            profile.subscription_expires_at = timezone.now() + timedelta(days=30)
            profile.save()
            updated += 1
        self.message_user(request, f'✅ {updated} profil(s) mis en Premium 1 mois.')
    activate_premium_1_month.short_description = '✅ Activer Premium 1 mois'

    def revoke_premium(self, request, queryset):
        updated = queryset.update(
            subscription_tier='free',
            subscription_expires_at=None,
            trial_active=False
        )
        self.message_user(request, f'❌ {updated} profil(s) repassés en Free.')
    revoke_premium.short_description = '❌ Révoquer Premium'

    def start_trial_30(self, request, queryset):
        from datetime import timedelta
        updated = 0
        for profile in queryset:
            profile.trial_active = True
            profile.trial_started_at = timezone.now()
            profile.trial_expires_at = timezone.now() + timedelta(days=30)
            profile.trial_used = True
            profile.save()
            updated += 1
        self.message_user(request, f'🔶 {updated} trial(s) de 30 jours activé(s).')
    start_trial_30.short_description = '🔶 Démarrer trial 30 jours'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(UserValue)
class UserValueAdmin(admin.ModelAdmin):
    list_display = ('user', 'value', 'priority', 'selected_at')
    list_filter = ('value', 'priority', 'selected_at')
    search_fields = ('user__username', 'value')
    ordering = ('user', 'priority')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# ==========================================
# CONFIGURATION ADMIN FINANCIER
# ==========================================

@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ('user', 'source', 'description', 'monthly_amount', 'is_regular', 'is_active')
    list_filter = ('source', 'is_regular', 'is_active', 'created_at')
    search_fields = ('user__username', 'description')
    readonly_fields = ('created_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('user', 'source', 'description', 'amount', 'date', 'is_validated')
    list_filter = ('source', 'is_validated', 'date', 'created_at')
    search_fields = ('user__username', 'description')
    readonly_fields = ('created_at',)
    date_hierarchy = 'date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'description', 'amount', 'date', 'is_necessary')
    list_filter = ('category', 'is_necessary', 'date', 'created_at')
    search_fields = ('user__username', 'description')
    readonly_fields = ('created_at',)
    date_hierarchy = 'date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'allocated_amount', 'period', 'is_active', 'usage_percentage_display')
    list_filter = ('category', 'period', 'is_active', 'created_at')
    search_fields = ('user__username', 'category')
    readonly_fields = ('created_at', 'updated_at')

    def usage_percentage_display(self, obj):
        try:
            percentage = float(obj.usage_percentage)
        except (TypeError, ValueError):
            percentage = 0

        if percentage > 100:
            color = 'red'
        elif percentage > 80:
            color = 'orange'
        else:
            color = 'green'

        percentage_str = f"{percentage:.1f}"
        return format_html('<span style="color: {};">{}%</span>', color, percentage_str)
    usage_percentage_display.short_description = 'Utilisation'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'target_amount', 'current_amount', 'progress_bar', 'deadline', 'is_achieved')
    list_filter = ('category', 'is_achieved', 'deadline', 'created_at')
    search_fields = ('user__username', 'title', 'description')
    readonly_fields = ('created_at', 'updated_at', 'progress_percentage')
    date_hierarchy = 'deadline'

    def progress_bar(self, obj):
        try:
            percentage = float(obj.progress_percentage)
        except (TypeError, ValueError):
            percentage = 0

        if percentage >= 100:
            color = 'green'
        elif percentage >= 50:
            color = 'orange'
        else:
            color = 'red'

        percentage_str = f"{percentage:.1f}"
        width = min(percentage, 100)

        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0;">'
            '<div style="width: {}%; background-color: {}; height: 20px; text-align: center; color: white;">'
            '{}%</div></div>',
            width, color, percentage_str
        )
    progress_bar.short_description = 'Progression'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Saving)
class SavingAdmin(admin.ModelAdmin):
    list_display = ('user', 'goal', 'amount', 'date', 'account_type', 'is_available')
    list_filter = ('goal', 'account_type', 'is_available', 'date')
    search_fields = ('user__username', 'description')
    readonly_fields = ('created_at',)
    date_hierarchy = 'date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# ==========================================
# CONFIGURATION ADMIN TONTINES
# ==========================================

class TontineParticipantInline(admin.TabularInline):
    model = TontineParticipant
    extra = 0
    readonly_fields = ('joined_at', 'display_total_contributions')

    def display_total_contributions(self, obj):
        if obj.pk:
            try:
                return f"{float(obj.total_contributions):,.0f} FCFA"
            except (TypeError, ValueError):
                return "-"
        return "-"
    display_total_contributions.short_description = 'Contributions totales'


class TontineContributionInline(admin.TabularInline):
    model = TontineContribution
    extra = 0
    readonly_fields = ('created_at', 'validated_at')


@admin.register(Tontine)
class TontineAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'creator', 'status', 'monthly_contribution',
        'participants_count', 'progress_display', 'start_date', 'end_date'
    )
    list_filter = ('status', 'frequency', 'is_private', 'start_date', 'created_at')
    search_fields = ('name', 'description', 'creator__username')
    readonly_fields = ('invitation_code', 'created_at', 'updated_at', 'display_progress_percentage')
    date_hierarchy = 'start_date'
    inlines = [TontineParticipantInline]

    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'description', 'creator')
        }),
        ('Configuration financière', {
            'fields': ('total_amount', 'monthly_contribution', 'max_participants', 'duration_months', 'frequency')
        }),
        ('Dates et statut', {
            'fields': ('start_date', 'end_date', 'status')
        }),
        ('Paramètres', {
            'fields': ('is_private', 'invitation_code', 'rules')
        }),
        ('Statistiques', {
            'fields': ('display_progress_percentage',),
            'classes': ('collapse',)
        }),
        ('Dates système', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def participants_count(self, obj):
        count = obj.participants.count()
        return f"{count}/{obj.max_participants}"
    participants_count.short_description = 'Participants'

    def progress_display(self, obj):
        try:
            percentage = float(obj.progress_percentage)
        except (TypeError, ValueError):
            percentage = 0

        percentage_str = f"{percentage:.0f}"
        width = min(percentage, 100)

        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0;">'
            '<div style="width: {}%; background-color: #4CAF50; height: 15px; text-align: center; color: white; font-size: 11px;">'
            '{}%</div></div>',
            width, percentage_str
        )
    progress_display.short_description = 'Progression'

    def display_progress_percentage(self, obj):
        if obj.pk:
            try:
                return f"{float(obj.progress_percentage):.1f}%"
            except (TypeError, ValueError):
                return "-"
        return "-"
    display_progress_percentage.short_description = 'Pourcentage de progression'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('creator').prefetch_related('participants')


@admin.register(TontineParticipant)
class TontineParticipantAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'tontine', 'position', 'is_admin', 'is_active',
        'contribution_status_display', 'received_payout'
    )
    list_filter = ('is_admin', 'is_active', 'received_payout', 'joined_at')
    search_fields = ('user__username', 'tontine__name')
    readonly_fields = ('joined_at', 'display_total_contributions')
    inlines = [TontineContributionInline]

    def contribution_status_display(self, obj):
        status = obj.contribution_status
        colors = {'up_to_date': 'green', 'behind': 'orange', 'late': 'red'}
        labels = {'up_to_date': 'À jour', 'behind': 'En retard', 'late': 'Très en retard'}
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(status, 'black'),
            labels.get(status, status)
        )
    contribution_status_display.short_description = 'Statut contributions'

    def display_total_contributions(self, obj):
        if obj.pk:
            try:
                return f"{float(obj.total_contributions):,.0f} FCFA"
            except (TypeError, ValueError):
                return "-"
        return "-"
    display_total_contributions.short_description = 'Contributions totales'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'tontine')


@admin.register(TontineContribution)
class TontineContributionAdmin(admin.ModelAdmin):
    list_display = (
        'participant_name', 'tontine_name', 'amount', 'date',
        'is_validated', 'payment_method', 'created_at'
    )
    list_filter = ('is_validated', 'payment_method', 'date', 'created_at')
    search_fields = ('participant__user__username', 'participant__tontine__name', 'transaction_reference')
    readonly_fields = ('created_at', 'validated_at')
    date_hierarchy = 'date'

    def participant_name(self, obj):
        return obj.participant.user.username
    participant_name.short_description = 'Participant'

    def tontine_name(self, obj):
        return obj.participant.tontine.name
    tontine_name.short_description = 'Tontine'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('participant__user', 'participant__tontine')


@admin.register(TontinePayout)
class TontinePayoutAdmin(admin.ModelAdmin):
    list_display = (
        'recipient_name', 'tontine_name', 'amount', 'date',
        'is_processed', 'processed_by', 'created_at'
    )
    list_filter = ('is_processed', 'date', 'created_at')
    search_fields = ('recipient__user__username', 'tontine__name', 'transaction_reference')
    readonly_fields = ('created_at', 'processed_at')
    date_hierarchy = 'date'

    def recipient_name(self, obj):
        return obj.recipient.user.username
    recipient_name.short_description = 'Bénéficiaire'

    def tontine_name(self, obj):
        return obj.tontine.name
    tontine_name.short_description = 'Tontine'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipient__user', 'tontine', 'processed_by')


# ==========================================
# CONFIGURATION ADMIN DIAGNOSTIC
# ==========================================

@admin.register(DiagnosticResult)
class DiagnosticResultAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'overall_score', 'financial_health_score',
        'savings_capacity_score', 'planning_score', 'risk_management_score',
        'completed_at'
    )
    list_filter = ('completed_at',)
    search_fields = ('user__username',)
    readonly_fields = ('completed_at',)
    date_hierarchy = 'completed_at'

    fieldsets = (
        ('Utilisateur', {'fields': ('user',)}),
        ('Scores détaillés', {
            'fields': (
                'financial_health_score', 'savings_capacity_score',
                'planning_score', 'risk_management_score', 'overall_score'
            )
        }),
        ('Recommandations', {'fields': ('recommendations',)}),
        ('Date', {'fields': ('completed_at',)})
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# ==========================================
# CONFIGURATION ADMIN SITE
# ==========================================

admin.site.site_header = "Administration Yoonu Dal"
admin.site.site_title = "Yoonu Dal Admin"
admin.site.index_title = "Tableau de bord administrateur"


# ── Actions globales ─────────────────────────────────────────

def mark_as_validated(modeladmin, request, queryset):
    updated = queryset.update(is_validated=True, validated_by=request.user, validated_at=timezone.now())
    modeladmin.message_user(request, f'{updated} contribution(s) validée(s).')
mark_as_validated.short_description = "Marquer comme validé"


def mark_as_processed(modeladmin, request, queryset):
    updated = queryset.update(is_processed=True, processed_by=request.user, processed_at=timezone.now())
    modeladmin.message_user(request, f'{updated} versement(s) traité(s).')
mark_as_processed.short_description = "Marquer comme traité"

TontineContributionAdmin.actions = [mark_as_validated]
TontinePayoutAdmin.actions = [mark_as_processed]
