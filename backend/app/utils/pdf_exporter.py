import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.app.utils.date_utils import get_month_name

def generate_report_pdf(report_data: Dict[str, Any], currency: str = "INR") -> bytes:
    """
    Generates a high-quality PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Slate 900
    c_emerald = colors.HexColor("#059669")    # Emerald 600
    c_indigo = colors.HexColor("#4F46E5")     # Indigo 600
    c_light_bg = colors.HexColor("#F8FAFC")   # Slate 50
    c_border = colors.HexColor("#E2E8F0")     # Slate 200
    c_muted = colors.HexColor("#64748B")      # Slate 500
    
    # Custom Styles
    brand_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=c_primary,
        spaceAfter=2
    )
    tagline_style = ParagraphStyle(
        'BrandTagline',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=c_muted,
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#334155"),
        leading=14
    )
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=colors.HexColor("#1E293B"),
        leading=13,
        leftIndent=12,
        spaceAfter=4
    )

    story = []

    month = report_data.get("month", 10)
    year = report_data.get("year", 2026)
    month_str = get_month_name(month)

    # 1. Header
    story.append(Paragraph("SpendIQ", brand_style))
    story.append(Paragraph("Understand your spending. Improve your finances. • Monthly Financial Report", tagline_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_indigo, spaceAfter=15))

    # 2. Title & Period
    story.append(Paragraph(f"Financial Report — {month_str} {year}", h2_style))

    # 3. Overview Cards (Table format)
    income = report_data.get("total_income", 0.0)
    expenses = report_data.get("total_expenses", 0.0)
    savings = report_data.get("total_savings", 0.0)
    savings_rate = report_data.get("savings_rate", 0.0)

    sym = "₹" if currency == "INR" else f"{currency} "
    overview_data = [
        [
            Paragraph(f"<b>Total Income</b><br/><font size=13 color='#0F172A'>{sym}{int(income):,}</font>", body_style),
            Paragraph(f"<b>Total Expenses</b><br/><font size=13 color='#DC2626'>{sym}{int(expenses):,}</font>", body_style),
            Paragraph(f"<b>Net Savings</b><br/><font size=13 color='#059669'>{sym}{int(savings):,}</font>", body_style),
            Paragraph(f"<b>Savings Rate</b><br/><font size=13 color='#4F46E5'>{savings_rate:.1f}%</font>", body_style)
        ]
    ]
    overview_table = Table(overview_data, colWidths=[130, 130, 130, 140])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 15))

    # 4. AI Executive Summary
    story.append(Paragraph("AI Executive Summary", h2_style))
    summary_text = report_data.get("report_text") or "Monthly spending was balanced across active categories."
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 12))

    # 5. Category Breakdown Table
    story.append(Paragraph("Category Spending Breakdown", h2_style))
    cat_breakdown = report_data.get("category_breakdown", [])
    
    table_rows = [["Category", "Amount", "Share", "Transactions"]]
    for item in cat_breakdown[:8]:
        cat_name = item.get("category", "")
        amt = item.get("amount", 0.0)
        pct = item.get("percentage", 0.0)
        cnt = item.get("count", 0)
        table_rows.append([cat_name, f"{sym}{int(amt):,}", f"{pct:.1f}%", str(cnt)])

    if len(table_rows) > 1:
        cat_table = Table(table_rows, colWidths=[200, 120, 100, 110])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ]))
        story.append(cat_table)
    else:
        story.append(Paragraph("No category expense data recorded for this period.", body_style))
    story.append(Spacer(1, 15))

    # 6. Actionable AI Recommendations
    recs = report_data.get("recommendations", [])
    if recs:
        story.append(Paragraph("Actionable Recommendations", h2_style))
        for r in recs:
            story.append(Paragraph(f"• {r}", bullet_style))
        story.append(Spacer(1, 15))

    # 7. Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=10, spaceAfter=8))
    footer_text = f"Generated by SpendIQ Personal Finance AI Platform • {month_str} {year} Edition"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=c_muted, alignment=1)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
