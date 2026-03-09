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
def export_excel(request):
    """Export données financières vers Excel (Premium) - MOIS EN COURS"""
    try:
        user = request.user
        now = timezone.now()
        current_month = now.strftime('%B %Y')

        print(f"\n{'=' * 60}")
        print(f"📊 EXPORT EXCEL pour {user.username}")
        print(f"{'=' * 60}\n")

        # Récupérer le VRAI score
        yoonu_score = get_user_score(user)
        print(f"📊 Score final: {yoonu_score}\n")

        # Récupérer UNIQUEMENT les dépenses du mois en cours
        expenses = get_current_month_expenses(user)
        envelopes = Envelope.objects.filter(user=user)

        # Calculer statistiques DU MOIS - AVEC ARRONDI
        total_expenses_raw = sum(exp.amount for exp in expenses)
        total_expenses = format_amount(total_expenses_raw)

        profile = user.profile
        monthly_income_raw = profile.monthly_income or Decimal('0')
        monthly_income = format_amount(monthly_income_raw)

        balance = monthly_income - total_expenses

        print(f"💰 Revenus: {monthly_income_raw} → {monthly_income}")
        print(f"💸 Dépenses: {total_expenses}")
        print(f"💵 Solde: {balance}\n")

        # Créer workbook
        wb = Workbook()

        # === SHEET 1: Vue d'ensemble ===
        ws1 = wb.active
        ws1.title = "Vue d'ensemble"

        # Header
        ws1['A1'] = f"YOONU DAL - RAPPORT {current_month.upper()}"
        ws1['A1'].font = Font(size=16, bold=True, color="10B981")
        ws1['A2'] = f"Généré le {now.strftime('%d/%m/%Y à %H:%M')}"
        ws1['A2'].font = Font(size=10, italic=True)

        # Score
        ws1['A4'] = "Score Yoonu Dal"
        ws1['B4'] = yoonu_score
        ws1['A4'].font = Font(bold=True)
        ws1['B4'].font = Font(size=14, bold=True, color="10B981")

        # Stats du mois
        ws1['A6'] = f"Revenus {current_month}"
        ws1['B6'] = monthly_income
        ws1['A7'] = f"Dépenses {current_month}"
        ws1['B7'] = total_expenses
        ws1['A8'] = "Solde"
        ws1['B8'] = balance
        ws1['A9'] = "Nombre de dépenses"
        ws1['B9'] = expenses.count()

        for row in range(6, 10):
            ws1[f'A{row}'].font = Font(bold=True)
            if row < 9:
                ws1[f'B{row}'].number_format = '#,##0'

        # === SHEET 2: Dépenses du mois ===
        ws2 = wb.create_sheet("Dépenses")
        ws2['A1'] = f"DÉPENSES DE {current_month.upper()}"
        ws2['A1'].font = Font(size=14, bold=True)

        # Headers
        headers = ['Date', 'Catégorie', 'Description', 'Montant']
        for idx, header in enumerate(headers, 1):
            cell = ws2.cell(row=3, column=idx, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")

        # Data
        for idx, expense in enumerate(expenses, 4):
            ws2.cell(row=idx, column=1, value=expense.date.strftime('%d/%m/%Y'))
            ws2.cell(row=idx, column=2, value=expense.category)
            ws2.cell(row=idx, column=3, value=expense.description or '-')
            ws2.cell(row=idx, column=4, value=format_amount(expense.amount)).number_format = '#,##0'

        # Total
        last_row = expenses.count() + 4
        ws2[f'C{last_row}'] = "TOTAL"
        ws2[f'C{last_row}'].font = Font(bold=True)
        ws2[f'D{last_row}'] = total_expenses
        ws2[f'D{last_row}'].font = Font(bold=True)
        ws2[f'D{last_row}'].number_format = '#,##0'

        # === SHEET 3: Enveloppes ===
        ws3 = wb.create_sheet("Enveloppes")
        ws3['A1'] = "BUDGET PAR ENVELOPPE (Système 50/30/20)"
        ws3['A1'].font = Font(size=14, bold=True)

        # Headers
        env_headers = ['Enveloppe', 'Budget', 'Dépensé', 'Reste', '%']
        for idx, header in enumerate(env_headers, 1):
            cell = ws3.cell(row=3, column=idx, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")

        # Data
        for idx, envelope in enumerate(envelopes, 4):
            envelope_name = envelope.get_envelope_type_display()
            budget = format_amount(envelope.monthly_budget)
            spent = format_amount(envelope.current_spent)
            remaining = budget - spent
            percentage = int(envelope.allocated_percentage)

            ws3.cell(row=idx, column=1, value=envelope_name)
            ws3.cell(row=idx, column=2, value=budget).number_format = '#,##0'
            ws3.cell(row=idx, column=3, value=spent).number_format = '#,##0'
            ws3.cell(row=idx, column=4, value=remaining).number_format = '#,##0'
            ws3.cell(row=idx, column=5, value=f"{percentage}%")

        # Générer fichier
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        month_filename = now.strftime("%Y_%m")
        response['Content-Disposition'] = f'attachment; filename=yoonu_dal_{month_filename}.xlsx'
        wb.save(response)

        print(f"✅ Export Excel OK\n")
        return response

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Erreur: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_premium
def export_pdf(request):
    """Export rapport PDF (Premium) - MOIS EN COURS"""
    try:
        user = request.user
        now = timezone.now()
        current_month = now.strftime('%B %Y')

        print(f"\n{'=' * 60}")
        print(f"📄 EXPORT PDF pour {user.username}")
        print(f"{'=' * 60}\n")

        # Récupérer le VRAI score
        yoonu_score = get_user_score(user)
        print(f"📄 Score final: {yoonu_score}\n")

        # Récupérer dépenses
        expenses = get_current_month_expenses(user)[:20]
        all_month_expenses = get_current_month_expenses(user)

        # Stats
        total_expenses = format_amount(sum(exp.amount for exp in all_month_expenses))
        monthly_income = format_amount(user.profile.monthly_income or Decimal('0'))
        balance = monthly_income - total_expenses

        # Créer PDF
        response = HttpResponse(content_type='application/pdf')
        month_filename = now.strftime("%Y_%m")
        response['Content-Disposition'] = f'attachment; filename=yoonu_dal_{month_filename}.pdf'

        doc = SimpleDocTemplate(response, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        # Titre
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#10B981'),
            spaceAfter=30
        )
        elements.append(Paragraph(f"Yoonu Dal - Rapport {current_month}", title_style))
        elements.append(Paragraph(f"Généré le {now.strftime('%d/%m/%Y')}", styles['Normal']))
        elements.append(Spacer(1, 1 * cm))

        # Score
        score_style = ParagraphStyle(
            'ScoreStyle',
            parent=styles['Normal'],
            fontSize=16,
            textColor=colors.HexColor('#10B981'),
            spaceAfter=20
        )
        elements.append(Paragraph(f"<b>Score Yoonu Dal:</b> {yoonu_score}/100", score_style))

        # Stats
        stats_data = [
            ['Indicateur', 'Montant'],
            ['Revenus mensuels', f'{monthly_income:,} FCFA'.replace(',', ' ')],
            ['Dépenses du mois', f'{total_expenses:,} FCFA'.replace(',', ' ')],
            ['Solde', f'{balance:,} FCFA'.replace(',', ' ')],
            ['Nombre de dépenses', str(all_month_expenses.count())]
        ]

        stats_table = Table(stats_data, colWidths=[8 * cm, 8 * cm])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        elements.append(stats_table)
        elements.append(Spacer(1, 1 * cm))

        # Dépenses
        elements.append(Paragraph(f"<b>Top 20 dépenses de {current_month}</b>", styles['Heading2']))
        elements.append(Spacer(1, 0.5 * cm))

        expenses_data = [['Date', 'Catégorie', 'Description', 'Montant']]
        for exp in expenses:
            amount = format_amount(exp.amount)
            amount_formatted = f'{amount:,} FCFA'.replace(',', ' ')
            expenses_data.append([
                exp.date.strftime('%d/%m/%Y'),
                exp.category[:15],
                (exp.description or '-')[:20],
                amount_formatted
            ])

        expenses_table = Table(expenses_data, colWidths=[3 * cm, 4 * cm, 5 * cm, 4 * cm])
        expenses_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        elements.append(expenses_table)
        doc.build(elements)

        print(f"✅ Export PDF OK\n")
        return response

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Erreur: {str(e)}'}, status=500)