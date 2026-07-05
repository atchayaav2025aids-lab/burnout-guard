import os
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def find_metric_value(metrics_dict, keywords, default="N/A"):
    """
    Fuzzy key lookup helper that scans keys ignoring capitalization, spaces, and underscores.
    """
    if not isinstance(metrics_dict, dict):
        return default
    for key, val in metrics_dict.items():
        key_lower = key.lower().replace("_", "").replace(" ", "")
        for kw in keywords:
            if kw in key_lower:
                return val
    return default

def generate_pdf_report(dataset_name: str, summary: dict, results_list: list, output_path: str):
    """
    Assembles a professional corporate PDF executive report using ReportLab.
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom Corporate Styles (Blue, White, Purple theme)
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1e1b4b'), # Deep Indigo
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#4f46e5'), # Indigo/Purple
        spaceBefore=15,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'), # Slate
        spaceAfter=10
    )
    
    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.white
    )
    
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    # 1. Header Page
    story.append(Paragraph("Employee Stress Risk Analysis System", title_style))
    story.append(Paragraph(f"Executive Cohort Summary Report: <strong>{dataset_name}</strong>", styles['Normal']))
    story.append(Paragraph(f"Generated on: <i>{datetime_str()}</i>", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Divider Line
    line_data = [['']]
    line_table = Table(line_data, colWidths=[530], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#4f46e5')),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 15))
    
    # 2. Executive Summary Card
    story.append(Paragraph("Executive Summary", h2_style))
    story.append(Paragraph(
        f"This report presents the stress level classification results and organizational health analysis for the cohort dataset "
        f"containing <strong>{summary.get('total_developers', len(results_list))} employees</strong>. Predictions were calculated using a "
        f"high-accuracy machine learning model (selected model: <strong>{summary.get('model_name', 'Rule-Based Classifier')}</strong>).",
        body_style
    ))
    
    # Counts Table
    dist = summary.get("risk_distribution", {"low": 0, "medium": 0, "high": 0})
    avg_score = summary.get("average_score", 0.0)
    
    kpi_data = [
        [Paragraph("Stress Level", header_style), Paragraph("Employee Count", header_style), Paragraph("Percentage", header_style)],
        [Paragraph("🟢 Low Stress", cell_style), Paragraph(str(dist.get("low", 0)), cell_style), Paragraph(f"{(dist.get('low',0)/len(results_list)*100):.1f}%", cell_style)],
        [Paragraph("🟡 Moderate Stress", cell_style), Paragraph(str(dist.get("medium", 0)), cell_style), Paragraph(f"{(dist.get('medium',0)/len(results_list)*100):.1f}%", cell_style)],
        [Paragraph("🔴 High Stress", cell_style), Paragraph(str(dist.get("high", 0)), cell_style), Paragraph(f"{(dist.get('high',0)/len(results_list)*100):.1f}%", cell_style)],
    ]
    
    kpi_table = Table(kpi_data, colWidths=[200, 160, 170])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e1b4b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 15))
    
    # 3. Key Findings
    story.append(Paragraph("Key Findings", h2_style))
    story.append(Paragraph(
        f"The average stress score for this cohort is <strong>{avg_score}%</strong>. "
        f"The analysis indicates that <strong>{dist.get('high', 0)} employees ({ (dist.get('high',0)/len(results_list)*100):.1f}%)</strong> are experiencing "
        f"high stress and should be prioritized for work rebalancing and wellness programs.",
        body_style
    ))
    
    # 4. Action Recommendations
    story.append(Paragraph("Strategic HR Recommendations", h2_style))
    recs = [
        "<strong>Reduce Overtime:</strong> Enforce strict limits on overtime and encourage teams to log off after working hours.",
        "<strong>Improve Work-Life Balance:</strong> Support flexible/hybrid arrangements and calendar audits to block focus times.",
        "<strong>Wellness Programs:</strong> Setup confidential counseling sessions and stress management seminars.",
        "<strong>Optimize Workload:</strong> Proactively redistribute tickets/tasks for employees flagged with 'High Stress'."
    ]
    for r in recs:
        story.append(Paragraph(f"• {r}", body_style))
        
    story.append(PageBreak())
    
    # 5. High Risk Employees List Table (Limit to top 20 for PDF space)
    story.append(Paragraph("High Risk Employees List", h2_style))
    story.append(Paragraph("The following employees were classified in the High Stress segment and require attention:", body_style))
    
    # Check both risk_level and risk_bucket keys for compatibility
    high_risk_list = [d for d in results_list if d.get("risk_level") == "High" or d.get("risk_bucket") == "High"]
    
    table_data = [
        [Paragraph("Employee ID", header_style), Paragraph("Department", header_style), Paragraph("Daily Hours", header_style), Paragraph("Tasks", header_style), Paragraph("Stress Score", header_style)]
    ]
    
    for dev in high_risk_list[:20]:
        metrics = dev.get("raw_metrics", {})
        # Query alternative casings for department, working hours, and tasks count using find_metric_value
        dept_val = dev.get("department", find_metric_value(metrics, ["department", "dept", "team"], default="N/A"))
        hours_val = find_metric_value(metrics, ["workinghour", "hour", "duration"], default="N/A")
        tasks_val = find_metric_value(metrics, ["task", "ticket", "workload"], default="N/A")
        score_val = dev.get("stress_score", dev.get("risk_score", 0))
        
        table_data.append([
            Paragraph(dev.get("id", "N/A"), cell_style),
            Paragraph(str(dept_val), cell_style),
            Paragraph(f"{hours_val} hrs" if hours_val != "N/A" else "N/A", cell_style),
            Paragraph(str(tasks_val), cell_style),
            Paragraph(f"<strong>{score_val}%</strong>", cell_style)
        ])
        
    if not high_risk_list:
        table_data.append([Paragraph("No employees identified in the high stress tier.", cell_style), "", "", "", ""])
    elif len(high_risk_list) > 20:
        table_data.append([Paragraph(f"...and {len(high_risk_list) - 20} more employees flagged as high stress.", cell_style), "", "", "", ""])
        
    list_table = Table(table_data, colWidths=[100, 130, 100, 100, 100])
    list_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(list_table)
    
    doc.build(story)

def generate_excel_report(results_list: list, output_path: str):
    """
    Saves predictions and raw metrics to an Excel file.
    """
    rows = []
    for item in results_list:
        data = {
            "Employee ID": item.get("id"),
            "Predicted Stress Level": item.get("risk_level", item.get("risk_bucket")),
            "Stress Score %": item.get("stress_score", item.get("risk_score")),
            "Primary Stress Factor": item.get("top_factors", ["None"])[0] if item.get("top_factors") else "N/A"
        }
        # Unpack raw metrics
        data.update(item.get("raw_metrics", {}))
        rows.append(data)
        
    df = pd.DataFrame(rows)
    df.to_excel(output_path, index=False, engine="openpyxl")

def generate_csv_report(results_list: list, output_path: str):
    """
    Saves predictions and raw metrics to a CSV file.
    """
    rows = []
    for item in results_list:
        data = {
            "Employee ID": item.get("id"),
            "Predicted Stress Level": item.get("risk_level", item.get("risk_bucket")),
            "Stress Score %": item.get("stress_score", item.get("risk_score")),
            "Primary Stress Factor": item.get("top_factors", ["None"])[0] if item.get("top_factors") else "N/A"
        }
        data.update(item.get("raw_metrics", {}))
        rows.append(data)
        
    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)

def datetime_str():
    import datetime
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
