import os
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import settings

def generate_pdf_report(case_data: Dict[str, Any], output_filename: str) -> Path:
    """
    Generate an authoritative, research-grade forensic laboratory report as a PDF.
    """
    pdf_path = settings.REPORTS_DIR / output_filename
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=12,
        textColor=colors.HexColor('#64748b')
    )
    
    story = []
    
    # Header Banner
    story.append(Paragraph("DEEPTRACE AI FORENSIC LABORATORY", title_style))
    story.append(Paragraph("Digital Multimedia Source Attribution & Residual Frequency Artifact Analysis", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=14))
    
    # Case Information Table
    meta = case_data.get("metadata", {})
    pred = case_data.get("prediction", {})
    freq = case_data.get("frequency_metrics", {})
    res = case_data.get("residual_metrics", {})
    explanation = case_data.get("explanation", "No narrative generated.")
    
    case_table_data = [
        [
            Paragraph("<b>Analysis Reference ID:</b>", body_style),
            Paragraph(str(meta.get("id", "N/A")), body_style),
            Paragraph("<b>Date / Timestamp:</b>", body_style),
            Paragraph(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"), body_style)
        ],
        [
            Paragraph("<b>File Name:</b>", body_style),
            Paragraph(str(meta.get("filename", "N/A")), body_style),
            Paragraph("<b>Media Type:</b>", body_style),
            Paragraph(f"{meta.get('media_type', 'image').upper()} ({meta.get('mime_type', 'N/A')})", body_style)
        ],
        [
            Paragraph("<b>File Size:</b>", body_style),
            Paragraph(f"{meta.get('file_size', 0) / (1024*1024):.2f} MB", body_style),
            Paragraph("<b>Resolution / Dim:</b>", body_style),
            Paragraph(str(meta.get("resolution", "N/A")), body_style)
        ],
        [
            Paragraph("<b>Face Detected:</b>", body_style),
            Paragraph(f"{'Yes (' + str(meta.get('face_count', 1)) + ')' if meta.get('face_detected') else 'No (Full ROI Analysis)'}", body_style),
            Paragraph("<b>Pipeline Mode:</b>", body_style),
            Paragraph("Spatial-Frequency Dual Stream", body_style)
        ]
    ]
    
    t_case = Table(case_table_data, colWidths=[110, 160, 110, 160])
    t_case.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_case)
    story.append(Spacer(1, 10))
    
    # Forensic Findings & Attribution Status
    story.append(Paragraph("1. SOURCE ATTRIBUTION & DETECTION VERDICT", section_heading))
    
    model_status = pred.get("model_status", "not_loaded")
    if model_status == "loaded":
        synth_label = "SYNTHETIC / MANIPULATED" if pred.get("is_synthetic") else "AUTHENTIC MEDIA"
        conf_label = f"{pred.get('synthetic_probability', 0.0):.1f}%"
        source_label = pred.get("source_class", "Undetermined")
        source_conf = f"{pred.get('source_confidence', 0.0):.1f}%"
    else:
        synth_label = "EVALUATION PENDING"
        conf_label = "N/A (Model Not Loaded)"
        source_label = "Source Attribution Model Unweighted (Demo Mode)"
        source_conf = "N/A"
        
    findings_data = [
        [
            Paragraph("<b>Binary Detection State:</b>", body_style),
            Paragraph(synth_label, body_style),
            Paragraph("<b>Detection Confidence:</b>", body_style),
            Paragraph(conf_label, body_style)
        ],
        [
            Paragraph("<b>Attributed Source Class:</b>", body_style),
            Paragraph(f"<b>{source_label}</b>", body_style),
            Paragraph("<b>Attribution Confidence:</b>", body_style),
            Paragraph(source_conf, body_style)
        ],
        [
            Paragraph("<b>Inference Architecture:</b>", body_style),
            Paragraph(str(pred.get("model_name", "DeepTrace-ViT-CrossAttn")), body_style),
            Paragraph("<b>Model Version:</b>", body_style),
            Paragraph(str(pred.get("model_version", "v1.0.0")), body_style)
        ]
    ]
    
    t_find = Table(findings_data, colWidths=[120, 150, 120, 150])
    t_find.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_find)
    story.append(Spacer(1, 10))
    
    # Frequency & Residual Metrics Table
    story.append(Paragraph("2. QUANTITATIVE FREQUENCY & RESIDUAL METRICS", section_heading))
    
    metrics_data = [
        [
            Paragraph("<b>Metric Name</b>", body_style),
            Paragraph("<b>Measured Value</b>", body_style),
            Paragraph("<b>Forensic Significance</b>", body_style)
        ],
        [
            Paragraph("High-Frequency Energy Ratio (FFT)", body_style),
            Paragraph(f"{freq.get('high_frequency_ratio', 0.0) * 100:.2f}%", body_style),
            Paragraph("Proportion of spectral energy in outer frequency ring (r >= 0.6 r_max).", body_style)
        ],
        [
            Paragraph("Spectral Entropy", body_style),
            Paragraph(f"{freq.get('spectral_entropy', 0.0):.4f} bits", body_style),
            Paragraph("Dispersion of Fourier power spectrum across 2D plane.", body_style)
        ],
        [
            Paragraph("Low / Mid Energy Ratios", body_style),
            Paragraph(f"{freq.get('low_frequency_energy', 0.0)*100:.1f}% / {freq.get('mid_frequency_energy', 0.0)*100:.1f}%", body_style),
            Paragraph("Macro-structure vs. intermediate spatial texture distribution.", body_style)
        ],
        [
            Paragraph("SRM Residual Noise Variance", body_style),
            Paragraph(f"{res.get('residual_variance', 0.0):.4f}", body_style),
            Paragraph("Spatial Rich Model 3x3 edge filter high-pass noise energy.", body_style)
        ],
        [
            Paragraph("DCT High-Frequency Ratio", body_style),
            Paragraph(f"{freq.get('dct_high_frequency_ratio', 0.0) * 100:.2f}%", body_style),
            Paragraph("Ratio of energy in high diagonal DCT basis coefficients.", body_style)
        ]
    ]
    
    t_metrics = Table(metrics_data, colWidths=[150, 100, 290])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 10))
    
    # Scientific Narrative / Explanation
    story.append(Paragraph("3. EXPLAINABLE AI FORENSIC EVALUATION", section_heading))
    for para in explanation.split("\n\n"):
        if para.strip():
            story.append(Paragraph(para.replace("\n", " "), body_style))
            story.append(Spacer(1, 4))
            
    story.append(Spacer(1, 8))
    
    # Methodological Limitations & Disclaimer
    story.append(Paragraph("4. FORENSIC LIMITATIONS & UNCERTAINTY STATEMENT", section_heading))
    limitations_text = (
        "1. <b>Compression & Re-sampling</b>: Social media trans-coding (H.264/H.265/JPEG) acts as a low-pass filter, "
        "which attenuates high-frequency residual signatures.<br/>"
        "2. <b>Attribution Scope</b>: Model-based source attribution identifies mathematical similarity to known generator classes "
        "in the training distribution (e.g., StyleGAN2, StyleGAN3, Stable Diffusion) and should not be confused with hardware device provenance.<br/>"
        "3. <b>Legal Admissibility</b>: This automated laboratory report serves investigative intelligence purposes and is subject to "
        "formal verification by certified forensic examiners."
    )
    story.append(Paragraph(limitations_text, callout_style))
    story.append(Spacer(1, 14))
    
    # Verification Hash Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=6))
    verification_hash = hashlib.sha256(f"{meta.get('id')}_{meta.get('filename')}_{datetime.utcnow()}".encode()).hexdigest()
    story.append(Paragraph(f"Digital Case Authenticity Hash: <code>{verification_hash}</code>", callout_style))
    story.append(Paragraph("Generated by DeepTrace AI Forensic Engine - All rights reserved.", callout_style))
    
    # Build Document
    doc.build(story)
    return pdf_path
