import os
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header
        self.drawString(54, 750, "Open Source Ecosystem Intelligence Platform")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_text)
        self.drawString(54, 40, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.line(54, 55, 558, 55)
        self.restoreState()

def generate_pdf_report(
    repo_name: str,
    scores: Dict[str, Any],
    contributor_metrics: Dict[str, Any],
    velocity_metrics: Dict[str, Any],
    dependency_metrics: List[Dict[str, Any]],
    risk_alerts: List[Dict[str, Any]],
    output_path: str
) -> str:
    """
    Generates a production-grade PDF executive report for a given repository.
    Saves it to output_path.
    """
    # Create directory if it does not exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 54pt margins give 0.75 in margin. Printable area: 8.5x11 inches -> width 612, height 792.
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Define custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    bold_body_style = ParagraphStyle(
        'DocBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    header_style = ParagraphStyle(
        'DocTableHeader',
        parent=bold_body_style,
        textColor=colors.white
    )
    
    story = []
    
    # 1. Document Title / Cover Header
    story.append(Paragraph(f"Ecosystem Evaluation Report", title_style))
    story.append(Paragraph(f"Repository: <b>{repo_name}</b>", ParagraphStyle('Sub', parent=body_style, fontSize=12, leading=16)))
    story.append(Spacer(1, 15))
    
    # 2. Executive Summary Box
    summary_text = (
        f"This report presents a comprehensive multi-dimensional health audit of the <b>{repo_name}</b> repository. "
        f"Evaluations cover developer velocity, dependency freshness, licensing compatibility, and security vulnerabilities. "
        f"The repository achieved an overall health index of <b>{scores.get('overall_score', 0)}/100</b>, "
        f"placing its operational risk classification under the <b>{get_risk_level_label(scores.get('overall_score', 0))}</b> tier."
    )
    
    summary_table = Table([[Paragraph(summary_text, body_style)]], colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#bfdbfe")),
        ('PADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # 3. Health Score Breakdown
    story.append(Paragraph("1. Health Indices Breakdown", h1_style))
    story.append(Paragraph("Operational dimensions are rated from 0 to 100:", body_style))
    
    health_data = [
        [Paragraph("Dimension", header_style), Paragraph("Score", header_style), Paragraph("Target Benchmark", header_style)],
        [Paragraph("Overall Health Score", body_style), Paragraph(f"{scores.get('overall_score', 0)} / 100", bold_body_style), Paragraph("70.0 / 100", body_style)],
        [Paragraph("Code Activity & Velocity", body_style), Paragraph(f"{scores.get('activity_score', 0)} / 100", body_style), Paragraph("68.0 / 100", body_style)],
        [Paragraph("Community Engagement", body_style), Paragraph(f"{scores.get('community_score', 0)} / 100", body_style), Paragraph("72.0 / 100", body_style)],
        [Paragraph("Security Posture", body_style), Paragraph(f"{scores.get('security_score', 0)} / 100", body_style), Paragraph("75.0 / 100", body_style)],
        [Paragraph("Contributor Sustainability", body_style), Paragraph(f"{scores.get('sustainability_score', 0)} / 100", body_style), Paragraph("65.0 / 100", body_style)],
        [Paragraph("Maintainability & Docs", body_style), Paragraph(f"{scores.get('maintainability_score', 0)} / 100", body_style), Paragraph("70.0 / 100", body_style)],
    ]
    
    health_table = Table(health_data, colWidths=[204, 150, 150])
    health_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(health_table)
    story.append(Spacer(1, 20))
    
    # 4. Contributor Sustainability Assessment
    story.append(Paragraph("2. Contributor Sustainability & Key Person Risks", h1_style))
    bus_factor = contributor_metrics.get("bus_factor", 1)
    hhi = contributor_metrics.get("concentration_index", 10000)
    
    sustain_text = (
        f"The project has a <b>Bus Factor of {bus_factor}</b>, indicating that {bus_factor} key contributor(s) account "
        f"for over 50% of the active repository commits. The Herfindahl-Hirschman Concentration Index (HHI) "
        f"is evaluated at <b>{hhi}</b> (HHI index values above 2500 signify highly concentrated ownership)."
    )
    story.append(Paragraph(sustain_text, body_style))
    story.append(Spacer(1, 10))
    
    # 5. Security & Dependency Assessment
    story.append(Paragraph("3. Security Vulnerability & Dependency Review", h1_style))
    stale_deps = sum(1 for d in dependency_metrics if d.get("staleness_score", 0.0) >= 30.0)
    total_deps = len(dependency_metrics)
    
    sec_summary = (
        f"Out of <b>{total_deps}</b> parsed dependency package manifest requirements, "
        f"<b>{stale_deps}</b> libraries are outdated or mismatched against the latest registry releases. "
    )
    story.append(Paragraph(sec_summary, body_style))
    
    # List risk alerts (vulnerability specific)
    vuln_alerts = [a for a in risk_alerts if a["type"] == "security"]
    if vuln_alerts:
        story.append(Paragraph("Detected Vulnerability Highlights:", bold_body_style))
        for valert in vuln_alerts[:4]:
            story.append(Paragraph(f"• <b>[{valert['severity']}]</b> {valert['message']} - <i>{valert['description']}</i>", bullet_style))
    else:
        story.append(Paragraph("• <i>No critical CVE vulnerabilities were identified matching current dependency versions.</i>", bullet_style))
        
    story.append(Spacer(1, 15))
    story.append(PageBreak()) # Move to next page for recommendations and velocity

    # 6. Development Velocity Trends
    story.append(Paragraph("4. Development Activity Velocity", h1_style))
    velocity_text = (
        f"• Average Pull Request Cycle time: <b>{velocity_metrics.get('pr_merge_time_hours', 0)} hours</b> to merge.<br/>"
        f"• Average code review approval time: <b>{velocity_metrics.get('pr_review_time_hours', 0)} hours</b>.<br/>"
        f"• Issue ticket resolution velocity: <b>{velocity_metrics.get('issue_resolution_time_hours', 0)} hours</b> average.<br/>"
        f"• Lead Time for Changes: <b>{velocity_metrics.get('lead_time_for_changes_days', 0)} days</b>."
    )
    story.append(Paragraph(velocity_text, body_style))
    story.append(Spacer(1, 15))
    
    # 7. OSPO Actionable Recommendations
    story.append(Paragraph("5. OSPO Strategic Recommendations", h1_style))
    story.append(Paragraph("Based on evaluated risks, the Open Source Program Office recommends these adjustments:", body_style))
    
    added_recommendations = 0
    for alert in risk_alerts:
        if alert.get("recommendation"):
            story.append(Paragraph(f"<b>[Mitigate {alert['type'].replace('_', ' ').title()} Risk]</b> {alert['recommendation']}", bullet_style))
            added_recommendations += 1
            if added_recommendations >= 4:
                break
                
    if added_recommendations == 0:
        story.append(Paragraph("• <i>No critical action items needed. Continue monitoring scheduled scans.</i>", bullet_style))
        
    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    return output_path

def get_risk_level_label(score: float) -> str:
    if score >= 80:
        return "Low Risk (Highly Viable)"
    elif score >= 60:
        return "Moderate Risk (Stable)"
    elif score >= 40:
        return "Elevated Risk (Caution)"
    else:
        return "Critical Risk (Immediate Review)"
