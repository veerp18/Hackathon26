import boto3
import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io

s3 = boto3.client("s3")
BUCKET = "911-reports-pdf"

def lambda_handler(event, context):
    body = json.loads(event["body"])
    report = body["report"]
    report_type = body["report_type"]  # "police" or "medical"
    report_id = body["report_id"]

    # Generate PDF based on type
    if report_type == "police":
        pdf_buffer = generate_police_pdf(report)
    else:
        pdf_buffer = generate_medical_pdf(report)

    # Upload to S3
    key = f"reports/{report_id}.pdf"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=pdf_buffer,
        ContentType="application/pdf"
    )

    # Generate presigned URL (valid for 1 hour)
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=3600
    )

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        "body": json.dumps({"pdf_url": url})
    }


def generate_police_pdf(report: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    elements = []

    # Header
    header_style = ParagraphStyle('header', fontSize=16, fontName='Helvetica-Bold',
                                   alignment=TA_CENTER, spaceAfter=4)
    sub_style = ParagraphStyle('sub', fontSize=10, fontName='Helvetica',
                                alignment=TA_CENTER, spaceAfter=2, textColor=colors.grey)
    field_label = ParagraphStyle('label', fontSize=9, fontName='Helvetica-Bold',
                                  textColor=colors.HexColor('#333333'))
    field_value = ParagraphStyle('value', fontSize=10, fontName='Helvetica', spaceAfter=6)

    elements.append(Paragraph("POLICE INCIDENT REPORT", header_style))
    elements.append(Paragraph("National Incident-Based Reporting System (NIBRS)", sub_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.black))
    elements.append(Spacer(1, 12))

    # Incident Info Table
    incident_data = [
        ["Incident Number", report.get("incident_number", ""), "ORI Number", report.get("ori_number", "")],
        ["Incident Date", report.get("incident_date", ""), "Incident Time", report.get("incident_time", "")],
        ["Report Date", report.get("report_date", ""), "Report Status", report.get("report_status", "")],
        ["Domestic Violence", str(report.get("domestic_violence", "")), "Use of Force", str(report.get("use_of_force", ""))],
    ]
    t = Table(incident_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Location
    elements.append(Paragraph("LOCATION", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    loc = report.get("location", {})
    loc_data = [
        ["Address", loc.get("address", ""), "City", loc.get("city", "")],
        ["State", loc.get("state", ""), "ZIP", loc.get("zip", "")],
        ["Location Type", loc.get("location_type", ""), "", ""],
    ]
    t = Table(loc_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Officer
    elements.append(Paragraph("REPORTING OFFICER", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    officer = report.get("officer", {})
    officer_data = [
        ["Officer Name", officer.get("name", ""), "Badge Number", officer.get("badge_number", "")],
        ["Rank", officer.get("rank", ""), "Unit", officer.get("unit", "")],
    ]
    t = Table(officer_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Offenses
    elements.append(Paragraph("OFFENSES", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    offenses = report.get("offenses", [{}])
    for i, offense in enumerate(offenses):
        offense_data = [
            ["UCR Code", offense.get("ucr_offense_code", ""), "Description", offense.get("offense_description", "")],
            ["Attempted/Completed", offense.get("attempted_or_completed", ""), "Location Type", offense.get("location_type", "")],
            ["Weapon/Force", ", ".join(offense.get("weapon_force_used", [])), "Bias Motivation", offense.get("bias_motivation", "")],
        ]
        t = Table(offense_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 6))
    elements.append(Spacer(1, 6))

    # Victim
    elements.append(Paragraph("VICTIM(S)", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    victims = report.get("victims", [{}])
    for victim in victims:
        victim_data = [
            ["Name", victim.get("name", ""), "DOB", victim.get("dob", "")],
            ["Age", victim.get("age", ""), "Sex", victim.get("sex", "")],
            ["Race", victim.get("race", ""), "Ethnicity", victim.get("ethnicity", "")],
            ["Injury Type", ", ".join(victim.get("injury_type", [])), "Relationship to Offender", victim.get("relationship_to_offender", "")],
        ]
        t = Table(victim_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 6))
    elements.append(Spacer(1, 6))

    # Offender
    elements.append(Paragraph("OFFENDER(S)", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    offenders = report.get("offenders", [{}])
    for offender in offenders:
        offender_data = [
            ["Name", offender.get("name", ""), "DOB", offender.get("dob", "")],
            ["Age", offender.get("age", ""), "Sex", offender.get("sex", "")],
            ["Race", offender.get("race", ""), "Ethnicity", offender.get("ethnicity", "")],
            ["Suspected Drug Use", str(offender.get("suspected_drug_use", "")), "Gang Affiliation", offender.get("gang_affiliation", "")],
        ]
        t = Table(offender_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 6))

    # Narrative
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("NARRATIVE", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    elements.append(Paragraph(report.get("narrative", ""), field_value))
    elements.append(Spacer(1, 12))

    # Synopsis
    elements.append(Paragraph("SYNOPSIS", ParagraphStyle('section', fontSize=11,
                                fontName='Helvetica-Bold', spaceAfter=6,
                                backColor=colors.HexColor('#1a1a2e'),
                                textColor=colors.white, leftIndent=-6, rightIndent=-6)))
    elements.append(Paragraph(report.get("synopsis", ""), field_value))

    doc.build(elements)
    return buffer.getvalue()


def generate_medical_pdf(report: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    elements = []

    field_value = ParagraphStyle('value', fontSize=10, fontName='Helvetica', spaceAfter=6)

    def section(title):
        return Paragraph(title, ParagraphStyle('section', fontSize=11,
                          fontName='Helvetica-Bold', spaceAfter=6,
                          backColor=colors.HexColor('#7f1d1d'),
                          textColor=colors.white, leftIndent=-6, rightIndent=-6))

    def make_table(data):
        t = Table(data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        return t

    # Header
    elements.append(Paragraph("EMS PATIENT CARE REPORT", ParagraphStyle('header',
                    fontSize=16, fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=4)))
    elements.append(Paragraph("National EMS Information System (NEMSIS v3.5)", ParagraphStyle('sub',
                    fontSize=10, fontName='Helvetica', alignment=TA_CENTER,
                    spaceAfter=2, textColor=colors.grey)))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#7f1d1d')))
    elements.append(Spacer(1, 12))

    # Dispatch
    elements.append(section("DISPATCH INFORMATION"))
    dispatch = report.get("dispatch", {})
    elements.append(make_table([
        ["Incident #", dispatch.get("incident_number", ""), "Call Type", dispatch.get("call_type", "")],
        ["Dispatch Date", dispatch.get("dispatch_date", ""), "Dispatch Time", dispatch.get("dispatch_time", "")],
        ["Unit Notified", dispatch.get("unit_notified_time", ""), "En Route", dispatch.get("en_route_time", "")],
        ["On Scene", dispatch.get("arrived_on_scene_time", ""), "Patient Contact", dispatch.get("patient_contact_time", "")],
        ["Transport Time", dispatch.get("transport_time", ""), "At Destination", dispatch.get("arrived_at_destination_time", "")],
        ["Dispatch Complaint", dispatch.get("dispatch_complaint", ""), "Acuity", dispatch.get("dispatch_acuity", "")],
    ]))
    elements.append(Spacer(1, 12))

    # Agency
    elements.append(section("AGENCY & CREW"))
    agency = report.get("agency", {})
    crew = agency.get("crew", [{}])
    crew_names = ", ".join([c.get("name", "") for c in crew])
    crew_certs = ", ".join([c.get("certification_level", "") for c in crew])
    elements.append(make_table([
        ["Agency Name", agency.get("ems_agency_name", ""), "Unit Number", agency.get("unit_number", "")],
        ["Unit Type", agency.get("unit_type", ""), "", ""],
        ["Crew Names", crew_names, "Certifications", crew_certs],
    ]))
    elements.append(Spacer(1, 12))

    # Patient
    elements.append(section("PATIENT DEMOGRAPHICS"))
    patient = report.get("patient", {})
    elements.append(make_table([
        ["Name", patient.get("name", ""), "DOB", patient.get("dob", "")],
        ["Age", f"{patient.get('age', '')} {patient.get('age_units', '')}", "Sex", patient.get("sex", "")],
        ["Race", patient.get("race", ""), "Ethnicity", patient.get("ethnicity", "")],
        ["Address", patient.get("address", ""), "City", patient.get("city", "")],
        ["State", patient.get("state", ""), "ZIP", patient.get("zip", "")],
        ["Phone", patient.get("phone", ""), "Insurance", patient.get("insurance", "")],
    ]))
    elements.append(Spacer(1, 12))

    # Situation
    elements.append(section("SITUATION"))
    situation = report.get("situation", {})
    elements.append(make_table([
        ["Chief Complaint", situation.get("chief_complaint", ""), "Primary Impression", situation.get("primary_impression", "")],
        ["Secondary Impression", situation.get("secondary_impression", ""), "Cause of Injury", situation.get("cause_of_injury", "")],
        ["Mechanism of Injury", situation.get("mechanism_of_injury", ""), "ICD-10 Code", situation.get("provider_primary_impression_code", "")],
    ]))
    elements.append(Spacer(1, 12))

    # History
    elements.append(section("PATIENT HISTORY"))
    history = report.get("history", {})
    elements.append(make_table([
        ["Medical History", ", ".join(history.get("medical_history", [])), "Allergies", ", ".join(history.get("allergies", []))],
        ["Current Medications", ", ".join(history.get("current_medications", [])), "Last Oral Intake", history.get("last_oral_intake", "")],
    ]))
    elements.append(Spacer(1, 12))

    # Vitals
    elements.append(section("VITAL SIGNS"))
    vitals = report.get("vitals", [{}])
    vitals_header = [["Time", "BP", "HR", "RR", "SpO2", "Temp", "BGL", "Pain", "GCS", "ECG"]]
    vitals_rows = []
    for v in vitals:
        bp = f"{v.get('blood_pressure_systolic', '')}/{v.get('blood_pressure_diastolic', '')}"
        vitals_rows.append([
            v.get("taken_time", ""),
            bp,
            v.get("heart_rate", ""),
            v.get("respiratory_rate", ""),
            v.get("spo2", ""),
            v.get("temperature", ""),
            v.get("blood_glucose", ""),
            v.get("pain_scale", ""),
            v.get("gcs_total", ""),
            v.get("ecg_rhythm", ""),
        ])
    vt = Table(vitals_header + vitals_rows,
               colWidths=[0.7*inch, 0.8*inch, 0.5*inch, 0.5*inch,
                          0.6*inch, 0.6*inch, 0.5*inch, 0.5*inch, 0.5*inch, 0.95*inch])
    vt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7f1d1d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(vt)
    elements.append(Spacer(1, 12))

    # Procedures
    elements.append(section("PROCEDURES"))
    procedures = report.get("procedures", [{}])
    proc_header = [["Time", "Procedure", "Successful", "Performed By"]]
    proc_rows = [[
        p.get("time", ""),
        p.get("procedure", ""),
        "Yes" if p.get("successful") else "No",
        p.get("performed_by", "")
    ] for p in procedures]
    pt = Table(proc_header + proc_rows, colWidths=[1*inch, 2.5*inch, 1*inch, 2.5*inch])
    pt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7f1d1d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(pt)
    elements.append(Spacer(1, 12))

    # Medications
    elements.append(section("MEDICATIONS ADMINISTERED"))
    meds = report.get("medications_given", [{}])
    med_header = [["Time", "Medication", "Dose", "Unit", "Route", "By"]]
    med_rows = [[
        m.get("time", ""),
        m.get("medication_name", ""),
        m.get("dose", ""),
        m.get("unit", ""),
        m.get("route", ""),
        m.get("administered_by", "")
    ] for m in meds]
    mt = Table(med_header + med_rows, colWidths=[0.8*inch, 1.8*inch, 0.7*inch, 0.7*inch, 0.8*inch, 1.7*inch])
    mt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7f1d1d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(mt)
    elements.append(Spacer(1, 12))

    # Disposition
    elements.append(section("DISPOSITION"))
    disposition = report.get("disposition", {})
    elements.append(make_table([
        ["Transport Disposition", disposition.get("transport_disposition", ""), "Destination", disposition.get("transport_destination", "")],
        ["Destination Type", disposition.get("destination_type", ""), "Reason", disposition.get("reason_for_destination", "")],
        ["Transfer of Care Time", disposition.get("transfer_of_care_time", ""), "Receiving Staff", disposition.get("receiving_facility_staff_name", "")],
    ]))
    elements.append(Spacer(1, 12))

    # Narrative
    elements.append(section("NARRATIVE"))
    elements.append(Paragraph(report.get("narrative", ""), field_value))

    doc.build(elements)
    return buffer.getvalue()