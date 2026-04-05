# api/export_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from datetime import datetime
from django.utils import timezone
from decimal import Decimal
from .models import Expense, Envelope
from .payment_views import require_premium
from .models import Expense, Envelope, UserValue, Goal, Debt, Tontine, TontineParticipant, Income
from django.db.models import Sum, Q


def get_user_score(user):
    """Récupérer le VRAI score Yoonu Dal"""
    try:
        print(f"🔍 Calcul du score pour {user.username}...")

        from django.test.client import RequestFactory
        from rest_framework.test import force_authenticate
        from . import views

        # Créer une vraie requête HTTP
        factory = RequestFactory()
        request = factory.get('/api/yoonu-score/')

        # FORCER l'authentification
        force_authenticate(request, user=user)

        # Appeler la vue
        response = views.get_yoonu_score(request)

        if hasattr(response, 'data') and response.status_code == 200:
            score = response.data.get('total_score', 50)
            print(f"✅ Score = {score}")
            return int(score)
        else:
            print(f"❌ Status: {response.status_code}")

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()

    print(f"⚠️ Score par défaut: 50")
    return 50


def get_period_dates(period_type='month'):
    """Retourne start_date et period_label selon le type de période"""
    now = timezone.now()
    
    if period_type == 'quarter':
        quarter_month = ((now.month - 1) // 3) * 3 + 1
        start_date = now.replace(month=quarter_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = f"Q{(now.month-1)//3 + 1} {now.year}"
    elif period_type == 'year':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = str(now.year)
    else:  # month (par défaut)
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = now.strftime('%B %Y')
    
    return start_date, period_label, now

def get_period_expenses(user, start_date, end_date):
    """Récupérer les dépenses pour une période donnée"""
    return Expense.objects.filter(
        user=user,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('-date')

def get_period_incomes(user, start_date, end_date):
    """Récupérer les revenus pour une période donnée"""
    return Income.objects.filter(
        user=user,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('-date')
def get_current_month_expenses(user):
    """Récupérer uniquement les dépenses du mois en cours"""
    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    return Expense.objects.filter(
        user=user,
        date__gte=start_of_month,
        date__lte=now
    ).order_by('-date')


def format_amount(amount):
    """Formater un montant en entier (arrondi)"""
    if isinstance(amount, Decimal):
        return int(round(amount))
    return int(round(float(amount)))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_premium
# Mapping catégories → valeurs (identique à calculate_yoonu_score.py)
CATEGORY_TO_VALUE = {
    'famille': ['famille', 'alimentation', 'logement'],
    'spiritualite': ['spiritualité'],
    'education': ['éducation'],
    'sante': ['santé'],
    'travail': ['transport'],
    'loisirs': ['loisirs', 'vêtements'],
    'communaute': ['famille'],
}
def export_excel(request):
    """Export données financières vers Excel (Premium) - PÉRIODE FLEXIBLE"""
    try:
        user = request.user
        period_type = request.GET.get('period', 'month')  # ✅ NOUVEAU PARAMÈTRE
        
        start_date, period_label, now = get_period_dates(period_type)
        
        print(f"\n{'=' * 60}")
        print(f"📊 EXPORT EXCEL pour {user.username} - Période: {period_label}")
        print(f"{'=' * 60}\n")
 
        # Récupérer le VRAI score
        yoonu_score = get_user_score(user)
        
        # Récupérer données de la période
        expenses = get_period_expenses(user, start_date, now)
        incomes = get_period_incomes(user, start_date, now)
        envelopes = Envelope.objects.filter(user=user)
        goals = Goal.objects.filter(user=user, is_completed=False)
        debts = Debt.objects.filter(user=user, is_active=True)
        tontines = TontineParticipant.objects.filter(user=user, tontine__is_active=True).select_related('tontine')
        user_values = UserValue.objects.filter(user=user).order_by('priority')[:3]
 
        # Calculer statistiques
        total_expenses_raw = sum(exp.amount for exp in expenses)
        total_expenses = format_amount(total_expenses_raw)
        
        total_income_raw = sum(inc.amount for inc in incomes)
        total_income = format_amount(total_income_raw)
        
        balance = total_income - total_expenses
 
        # Créer workbook
        wb = Workbook()
 
        # === SHEET 1: Vue d'ensemble (EXISTANT - ENRICHI) ===
        ws1 = wb.active
        ws1.title = "Vue d'ensemble"
 
        ws1['A1'] = f"YOONU DAL - RAPPORT {period_label.upper()}"
        ws1['A1'].font = Font(size=16, bold=True, color="10B981")
        ws1['A2'] = f"Généré le {now.strftime('%d/%m/%Y à %H:%M')}"
        ws1['A2'].font = Font(size=10, italic=True)
 
        ws1['A4'] = "Score Yoonu Dal"
        ws1['B4'] = yoonu_score
        ws1['A4'].font = Font(bold=True)
        ws1['B4'].font = Font(size=14, bold=True, color="10B981")
 
        ws1['A6'] = f"Revenus {period_label}"
        ws1['B6'] = total_income
        ws1['A7'] = f"Dépenses {period_label}"
        ws1['B7'] = total_expenses
        ws1['A8'] = "Solde"
        ws1['B8'] = balance
        ws1['A9'] = "Taux d'épargne"
        ws1['B9'] = f"{(balance / total_income * 100) if total_income > 0 else 0:.1f}%"
        ws1['A10'] = "Nombre de dépenses"
        ws1['B10'] = expenses.count()
 
        for row in range(6, 11):
            ws1[f'A{row}'].font = Font(bold=True)
 
        # === SHEET 2: Revenus (✅ NOUVEAU) ===
        ws2 = wb.create_sheet("Revenus")
        ws2['A1'] = f"REVENUS DE {period_label.upper()}"
        ws2['A1'].font = Font(size=14, bold=True)
 
        headers = ['Date', 'Source', 'Description', 'Montant']
        for idx, header in enumerate(headers, 1):
            cell = ws2.cell(row=3, column=idx, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
 
        for idx, income in enumerate(incomes, 4):
            ws2.cell(row=idx, column=1, value=income.date.strftime('%d/%m/%Y'))
            ws2.cell(row=idx, column=2, value=income.source or '-')
            ws2.cell(row=idx, column=3, value=income.description or '-')
            ws2.cell(row=idx, column=4, value=format_amount(income.amount)).number_format = '#,##0'
 
        last_row = incomes.count() + 4
        ws2[f'C{last_row}'] = "TOTAL"
        ws2[f'C{last_row}'].font = Font(bold=True)
        ws2[f'D{last_row}'] = total_income
        ws2[f'D{last_row}'].font = Font(bold=True)
        ws2[f'D{last_row}'].number_format = '#,##0'
 
        # === SHEET 3: Dépenses (EXISTANT) ===
        ws3 = wb.create_sheet("Dépenses")
        ws3['A1'] = f"DÉPENSES DE {period_label.upper()}"
        ws3['A1'].font = Font(size=14, bold=True)
 
        headers = ['Date', 'Catégorie', 'Description', 'Montant']
        for idx, header in enumerate(headers, 1):
            cell = ws3.cell(row=3, column=idx, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
 
        for idx, expense in enumerate(expenses, 4):
            ws3.cell(row=idx, column=1, value=expense.date.strftime('%d/%m/%Y'))
            ws3.cell(row=idx, column=2, value=expense.get_category_display())
            ws3.cell(row=idx, column=3, value=expense.description or '-')
            ws3.cell(row=idx, column=4, value=format_amount(expense.amount)).number_format = '#,##0'
 
        last_row = expenses.count() + 4
        ws3[f'C{last_row}'] = "TOTAL"
        ws3[f'C{last_row}'].font = Font(bold=True)
        ws3[f'D{last_row}'] = total_expenses
        ws3[f'D{last_row}'].font = Font(bold=True)
        ws3[f'D{last_row}'].number_format = '#,##0'
 
        # === SHEET 4: Enveloppes (EXISTANT) ===
        ws4 = wb.create_sheet("Enveloppes")
        ws4['A1'] = "BUDGET PAR ENVELOPPE"
        ws4['A1'].font = Font(size=14, bold=True)
 
        env_headers = ['Enveloppe', 'Budget', 'Dépensé', 'Reste', '%']
        for idx, header in enumerate(env_headers, 1):
            cell = ws4.cell(row=3, column=idx, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
 
        for idx, envelope in enumerate(envelopes, 4):
            envelope_name = envelope.get_envelope_type_display()
            budget = format_amount(envelope.monthly_budget)
            spent = format_amount(envelope.current_spent)
            remaining = budget - spent
            percentage = int(envelope.allocated_percentage)
 
            ws4.cell(row=idx, column=1, value=envelope_name)
            ws4.cell(row=idx, column=2, value=budget).number_format = '#,##0'
            ws4.cell(row=idx, column=3, value=spent).number_format = '#,##0'
            ws4.cell(row=idx, column=4, value=remaining).number_format = '#,##0'
            ws4.cell(row=idx, column=5, value=f"{percentage}%")
 
        # === SHEET 5: Valeurs (✅ NOUVEAU) ===
        ws5 = wb.create_sheet("Alignement Valeurs")
        ws5['A1'] = "ALIGNEMENT AVEC TES VALEURS"
        ws5['A1'].font = Font(size=14, bold=True)
 
        if user_values.exists():
            val_headers = ['Priorité', 'Valeur', 'Dépenses', '% Budget', 'Cible', 'Écart']
            for idx, header in enumerate(val_headers, 1):
                cell = ws5.cell(row=3, column=idx, value=header)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
 
            for idx, value in enumerate(user_values, 4):
                # Calculer dépenses liées
                # Utiliser le mapping hardcodé
                related_categories = CATEGORY_TO_VALUE.get(value.value, [])
                value_expenses = expenses.filter(category__in=related_categories)
                value_amount = sum(exp.amount for exp in value_expenses)
                value_percent = (value_amount / total_expenses_raw * 100) if total_expenses_raw > 0 else 0
                target_percent = 30 - (value.priority - 1) * 5
                gap = value_percent - target_percent
 
                ws5.cell(row=idx, column=1, value=value.priority)
                ws5.cell(row=idx, column=2, value=value.value)
                ws5.cell(row=idx, column=3, value=format_amount(value_amount)).number_format = '#,##0'
                ws5.cell(row=idx, column=4, value=f"{value_percent:.1f}%")
                ws5.cell(row=idx, column=5, value=f"{target_percent}%")
                ws5.cell(row=idx, column=6, value=f"{gap:+.1f}%")
        else:
            ws5['A5'] = "Complète ton diagnostic pour voir l'alignement avec tes valeurs"
 
        # === SHEET 6: Objectifs (✅ NOUVEAU) ===
        ws6 = wb.create_sheet("Objectifs")
        ws6['A1'] = "OBJECTIFS EN COURS"
        ws6['A1'].font = Font(size=14, bold=True)
 
        if goals.exists():
            goal_headers = ['Objectif', 'Cible', 'Atteint', 'Reste', '% Progression', 'Échéance']
            for idx, header in enumerate(goal_headers, 1):
                cell = ws6.cell(row=3, column=idx, value=header)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
 
            for idx, goal in enumerate(goals, 4):
                target = format_amount(goal.target_amount)
                current = format_amount(goal.current_amount)
                remaining = target - current
                progress = (float(goal.current_amount) / float(goal.target_amount) * 100) if goal.target_amount > 0 else 0
 
                ws6.cell(row=idx, column=1, value=goal.name)
                ws6.cell(row=idx, column=2, value=target).number_format = '#,##0'
                ws6.cell(row=idx, column=3, value=current).number_format = '#,##0'
                ws6.cell(row=idx, column=4, value=remaining).number_format = '#,##0'
                ws6.cell(row=idx, column=5, value=f"{progress:.0f}%")
                ws6.cell(row=idx, column=6, value=goal.target_date.strftime('%d/%m/%Y') if goal.target_date else '-')
        else:
            ws6['A5'] = "Aucun objectif défini"
 
        # === SHEET 7: Dettes (✅ NOUVEAU) ===
        ws7 = wb.create_sheet("Dettes")
        ws7['A1'] = "GESTION DES DETTES"
        ws7['A1'].font = Font(size=14, bold=True)
 
        if debts.exists():
            debt_headers = ['Dette', 'Créancier', 'Total', 'Payé', 'Reste', '% Progression']
            for idx, header in enumerate(debt_headers, 1):
                cell = ws7.cell(row=3, column=idx, value=header)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color="F97316", end_color="F97316", fill_type="solid")
 
            for idx, debt in enumerate(debts, 4):
                total = format_amount(debt.total_amount)
                paid = format_amount(debt.amount_paid)
                remaining = total - paid
                progress = debt.progress_percentage if hasattr(debt, 'progress_percentage') else 0
 
                ws7.cell(row=idx, column=1, value=debt.name)
                ws7.cell(row=idx, column=2, value=debt.creditor or '-')
                ws7.cell(row=idx, column=3, value=total).number_format = '#,##0'
                ws7.cell(row=idx, column=4, value=paid).number_format = '#,##0'
                ws7.cell(row=idx, column=5, value=remaining).number_format = '#,##0'
                ws7.cell(row=idx, column=6, value=f"{progress:.0f}%")
        else:
            ws7['A5'] = "Aucune dette active. Bravo !"
 
        # === SHEET 8: Tontines (✅ NOUVEAU) ===
        ws8 = wb.create_sheet("Tontines")
        ws8['A1'] = "TONTINES ACTIVES"
        ws8['A1'].font = Font(size=14, bold=True)
 
        if tontines.exists():
            tontine_headers = ['Tontine', 'Participants', 'Contribution', 'Cycle', 'Position', 'Statut']
            for idx, header in enumerate(tontine_headers, 1):
                cell = ws8.cell(row=3, column=idx, value=header)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
 
            for idx, tp in enumerate(tontines, 4):
                tontine = tp.tontine
                participants_count = tontine.participants.count()
                
                ws8.cell(row=idx, column=1, value=tontine.name)
                ws8.cell(row=idx, column=2, value=participants_count)
                ws8.cell(row=idx, column=3, value=format_amount(tontine.contribution_amount)).number_format = '#,##0'
                ws8.cell(row=idx, column=4, value=f"{tontine.current_cycle}/{participants_count}")
                ws8.cell(row=idx, column=5, value=tp.position)
                ws8.cell(row=idx, column=6, value="Actif" if tp.is_active else "Inactif")
        else:
            ws8['A5'] = "Aucune tontine active"
 
        # Générer fichier
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f'yoonu_dal_{period_label.replace(" ", "_")}_{now.strftime("%Y%m%d")}.xlsx'
        response['Content-Disposition'] = f'attachment; filename={filename}'
        wb.save(response)
 
        print(f"✅ Export Excel OK - {period_label}\n")
        return response
 
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Erreur: {str(e)}'}, status=500)
 
# ========================================
# FIN DES MODIFICATIONS export_excel
# ========================================

# ==========================================
# ENRICHISSEMENT export_pdf
# Modifications à faire dans export_views.py
# ==========================================

# ========================================
# REMPLACER LA FONCTION export_pdf (ligne 216-334)
# ========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_premium
def export_pdf(request):
    """Export rapport PDF (Premium) - PÉRIODE FLEXIBLE - 7 PAGES"""
    try:
        user = request.user
        period_type = request.GET.get('period', 'month')  # ✅ NOUVEAU PARAMÈTRE
        
        start_date, period_label, now = get_period_dates(period_type)
        
        print(f"\n{'=' * 60}")
        print(f"📄 EXPORT PDF pour {user.username} - Période: {period_label}")
        print(f"{'=' * 60}\n")

        # Récupérer le VRAI score
        yoonu_score = get_user_score(user)
        
        # Récupérer données
        expenses = get_period_expenses(user, start_date, now)
        incomes = get_period_incomes(user, start_date, now)
        envelopes = Envelope.objects.filter(user=user)
        goals = Goal.objects.filter(user=user, is_completed=False)[:5]
        debts = Debt.objects.filter(user=user, is_active=True)
        tontines = TontineParticipant.objects.filter(user=user, tontine__is_active=True).select_related('tontine')
        user_values = UserValue.objects.filter(user=user).order_by('priority')[:3]

        # Stats
        total_expenses_raw = sum(exp.amount for exp in expenses)
        total_expenses = format_amount(total_expenses_raw)
        total_income = format_amount(sum(inc.amount for inc in incomes))
        balance = total_income - total_expenses
        savings_rate = (balance / total_income * 100) if total_income > 0 else 0

        # Créer PDF
        response = HttpResponse(content_type='application/pdf')
        filename = f'yoonu_dal_{period_label.replace(" ", "_")}_{now.strftime("%Y%m%d")}.pdf'
        response['Content-Disposition'] = f'attachment; filename={filename}'

        doc = SimpleDocTemplate(response, pagesize=A4, 
                              rightMargin=2*cm, leftMargin=2*cm, 
                              topMargin=2*cm, bottomMargin=2*cm)
        elements = []
        styles = getSampleStyleSheet()

        # Styles personnalisés
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#10B981'),
            spaceAfter=30,
            alignment=1  # Center
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#10B981'),
            spaceAfter=12,
            spaceBefore=12
        )

        # ==========================================
        # PAGE 1 : TABLEAU DE BORD
        # ==========================================
        
        elements.append(Paragraph(f"🌱 YOONU DAL", title_style))
        elements.append(Paragraph(f"Ton Bilan Financier Conscient", styles['Normal']))
        elements.append(Paragraph(f"{user.first_name} {user.last_name}", styles['Normal']))
        elements.append(Paragraph(f"Période : {period_label}", styles['Normal']))
        elements.append(Spacer(1, 0.5*cm))

        # Score
        elements.append(Paragraph("SCORE YOONU DAL", heading_style))
        score_data = [
            [f"Score Global : {yoonu_score}/100"],
        ]
        score_table = Table(score_data, colWidths=[15*cm])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 0.5*cm))

        # Vue d'ensemble
        elements.append(Paragraph("VUE D'ENSEMBLE", heading_style))
        overview_data = [
            ['Indicateur', 'Montant'],
            ['💰 Revenus totaux', f'{total_income:,} FCFA'.replace(',', ' ')],
            ['💸 Dépenses totales', f'{total_expenses:,} FCFA'.replace(',', ' ')],
            ['✅ Épargne', f'{balance:,} FCFA'.replace(',', ' ')],
            ['📊 Taux d\'épargne', f'{savings_rate:.1f}%'],
            ['📋 Nombre de dépenses', str(expenses.count())]
        ]

        overview_table = Table(overview_data, colWidths=[8*cm, 7*cm])
        overview_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(overview_table)
        elements.append(PageBreak())

        # ==========================================
        # PAGE 2 : ALIGNEMENT VALEURS
        # ==========================================
        
        elements.append(Paragraph("🎯 ALIGNEMENT AVEC TES VALEURS", heading_style))
        
        if user_values.exists():
            values_data = [['Valeur', 'Dépenses', '% Budget', 'Score Alignement']]
            
            for value in user_values:
                # Calculer dépenses liées
                # Utiliser le mapping hardcodé
                related_categories = CATEGORY_TO_VALUE.get(value.value, [])
                value_expenses = expenses.filter(category__in=related_categories)
                value_amount = sum(exp.amount for exp in value_expenses)
                value_percent = (value_amount / total_expenses_raw * 100) if total_expenses_raw > 0 else 0
                
                # Score alignement simplifié
                target_percent = 30 - (value.priority - 1) * 5
                alignment = 100 - abs(value_percent - target_percent) * 3
                alignment = max(0, min(100, alignment))
                
                values_data.append([
                    value.value,
                    f'{format_amount(value_amount):,} F'.replace(',', ' '),
                    f'{value_percent:.1f}%',
                    f'{alignment:.0f}%'
                ])
            
            values_table = Table(values_data, colWidths=[5*cm, 4*cm, 3*cm, 3*cm])
            values_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(values_table)
        else:
            elements.append(Paragraph("Complète ton diagnostic pour voir l'alignement avec tes valeurs.", styles['Normal']))
        
        elements.append(PageBreak())

        # ==========================================
        # PAGE 3 : 4 ENVELOPPES
        # ==========================================
        
        elements.append(Paragraph("📁 SYSTÈME DES 4 ENVELOPPES", heading_style))
        
        if envelopes.exists():
            env_data = [['Enveloppe', 'Budget', 'Dépensé', 'Reste', '% Utilisé']]
            
            envelope_names = {
                'essentiels': '🏠 Essentiels',
                'plaisirs': '🎉 Plaisirs',
                'projets': '💎 Projets',
                'liberation': '🔓 Libération'
            }
            
            for env in envelopes:
                env_name = envelope_names.get(env.envelope_type, env.envelope_type.capitalize())
                budget = format_amount(env.monthly_budget)
                spent = format_amount(env.current_spent)
                remaining = budget - spent
                percent_used = (float(env.current_spent) / float(env.monthly_budget) * 100) if env.monthly_budget > 0 else 0
                
                env_data.append([
                    env_name,
                    f'{budget:,} F'.replace(',', ' '),
                    f'{spent:,} F'.replace(',', ' '),
                    f'{remaining:,} F'.replace(',', ' '),
                    f'{percent_used:.0f}%'
                ])
            
            env_table = Table(env_data, colWidths=[4*cm, 3.5*cm, 3.5*cm, 3*cm, 2*cm])
            env_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(env_table)
        
        elements.append(PageBreak())

        # ==========================================
        # PAGE 4 : OBJECTIFS
        # ==========================================
        
        elements.append(Paragraph("🎯 OBJECTIFS EN COURS", heading_style))
        
        if goals.exists():
            goals_data = [['Objectif', 'Cible', 'Atteint', 'Reste', '% Progression']]
            
            for goal in goals:
                target = format_amount(goal.target_amount)
                current = format_amount(goal.current_amount)
                remaining = target - current
                progress = (float(goal.current_amount) / float(goal.target_amount) * 100) if goal.target_amount > 0 else 0
                
                goals_data.append([
                    goal.name[:25],
                    f'{target:,} F'.replace(',', ' '),
                    f'{current:,} F'.replace(',', ' '),
                    f'{remaining:,} F'.replace(',', ' '),
                    f'{progress:.0f}%'
                ])
            
            goals_table = Table(goals_data, colWidths=[4*cm, 3*cm, 3*cm, 3*cm, 3*cm])
            goals_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(goals_table)
        else:
            elements.append(Paragraph("Aucun objectif défini pour le moment.", styles['Normal']))
        
        elements.append(PageBreak())

        # ==========================================
        # PAGE 5 : DETTES
        # ==========================================
        
        elements.append(Paragraph("💳 GESTION DES DETTES", heading_style))
        
        if debts.exists():
            # Stats globales
            total_debt = sum(d.total_amount for d in debts)
            total_paid = sum(d.amount_paid for d in debts)
            total_remaining = total_debt - total_paid
            
            debt_overview = [
                ['Indicateur', 'Montant'],
                ['Total dettes', f'{format_amount(total_debt):,} F'.replace(',', ' ')],
                ['Déjà payé', f'{format_amount(total_paid):,} F'.replace(',', ' ')],
                ['Reste à payer', f'{format_amount(total_remaining):,} F'.replace(',', ' ')],
            ]
            
            debt_overview_table = Table(debt_overview, colWidths=[8*cm, 7*cm])
            debt_overview_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F97316')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(debt_overview_table)
            elements.append(Spacer(1, 0.5*cm))
            
            # Détail
            elements.append(Paragraph("Détail par dette", styles['Heading3']))
            
            debts_detail = [['Dette', 'Total', 'Payé', '% Progression']]
            
            for debt in debts:
                progress = debt.progress_percentage if hasattr(debt, 'progress_percentage') else 0
                debts_detail.append([
                    debt.name[:25],
                    f'{format_amount(debt.total_amount):,} F'.replace(',', ' '),
                    f'{format_amount(debt.amount_paid):,} F'.replace(',', ' '),
                    f'{progress:.0f}%'
                ])
            
            debts_table = Table(debts_detail, colWidths=[6*cm, 3*cm, 3*cm, 3*cm])
            debts_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F97316')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(debts_table)
        else:
            elements.append(Paragraph("Aucune dette active. Bravo ! 🎉", styles['Normal']))
        
        elements.append(PageBreak())

        # ==========================================
        # PAGE 6 : TONTINES
        # ==========================================
        
        elements.append(Paragraph("🦁 TONTINES ACTIVES", heading_style))
        
        if tontines.exists():
            tontines_data = [['Tontine', 'Participants', 'Contribution', 'Cycle', 'Statut']]
            
            for tp in tontines:
                tontine = tp.tontine
                participants_count = tontine.participants.count()
                cycle_info = f"{tontine.current_cycle}/{participants_count}"
                status = "✅ Actif" if tp.is_active else "⏸️ Inactif"
                
                tontines_data.append([
                    tontine.name[:25],
                    str(participants_count),
                    f'{format_amount(tontine.contribution_amount):,} F'.replace(',', ' '),
                    cycle_info,
                    status
                ])
            
            tontines_table = Table(tontines_data, colWidths=[5*cm, 2.5*cm, 3*cm, 2.5*cm, 3*cm])
            tontines_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(tontines_table)
        else:
            elements.append(Paragraph("Aucune tontine active.", styles['Normal']))
        
        elements.append(PageBreak())

        # ==========================================
        # PAGE 7 : TOP DÉPENSES
        # ==========================================
        
        elements.append(Paragraph("💸 TOP 10 DÉPENSES", heading_style))
        
        top_expenses = expenses.order_by('-amount')[:10]
        
        if top_expenses.exists():
            expenses_data = [['Description', 'Catégorie', 'Montant', 'Date']]
            
            for exp in top_expenses:
                amount = format_amount(exp.amount)
                amount_formatted = f'{amount:,} F'.replace(',', ' ')
                expenses_data.append([
                    exp.description[:25] if exp.description else '-',
                    exp.get_category_display()[:15],
                    amount_formatted,
                    exp.date.strftime('%d/%m/%Y')
                ])
            
            expenses_table = Table(expenses_data, colWidths=[5*cm, 4*cm, 3*cm, 3*cm])
            expenses_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(expenses_table)

        # Générer PDF
        doc.build(elements)

        print(f"✅ Export PDF OK - {period_label}\n")
        return response

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Erreur: {str(e)}'}, status=500)
