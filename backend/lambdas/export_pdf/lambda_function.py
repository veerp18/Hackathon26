import boto3
import json
from fpdf import FPDF

s3 = boto3.client("s3")
BUCKET = "911-reports-pdf"


def lambda_handler(event, context):
    try:
        body = json.loads(event["body"])
        report = body["report"]
        report_type = body["report_type"]
        report_id = body["report_id"]

        if report_type == "police":
            pdf_bytes = generate_police_pdf(report)
        else:
            pdf_bytes = generate_medical_pdf(report)

        key = f"reports/{report_id}.pdf"
        s3.put_object(Bucket=BUCKET, Key=key, Body=pdf_bytes, ContentType="application/pdf")

        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=3600
        )

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"pdf_url": url})
        }
    except Exception as e:
        import traceback
        print("ERROR:", traceback.format_exc())
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }


def sanitize(text) -> str:
    """Strip all non-ASCII characters so fpdf2's built-in fonts don't crash."""
    if text is None:
        return "-"
    s = str(text).strip()
    if not s:
        return "-"
    return s.encode("ascii", errors="replace").decode("ascii")


def add_section(pdf, title, color):
    pdf.set_fill_color(*color)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, f"  {title}", ln=True, fill=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)


def add_field(pdf, label, value):
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(55, 7, label + ":", ln=False)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 7, sanitize(value), ln=True)


def generate_police_pdf(report: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    police_blue = (26, 26, 46)

    # Header
    pdf.set_fill_color(*police_blue)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 12, "POLICE INCIDENT REPORT", ln=True, align="C", fill=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 7, "National Incident-Based Reporting System (NIBRS)", ln=True, align="C", fill=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    # Incident Info
    add_section(pdf, "INCIDENT INFORMATION", police_blue)
    add_field(pdf, "Incident Number", report.get("incident_number"))
    add_field(pdf, "Incident Date", report.get("incident_date"))
    add_field(pdf, "Incident Time", report.get("incident_time"))
    add_field(pdf, "Domestic Violence", str(report.get("domestic_violence", "")))
    add_field(pdf, "Use of Force", str(report.get("use_of_force", "")))
    pdf.ln(3)

    # Location
    loc = report.get("location", {})
    add_section(pdf, "LOCATION", police_blue)
    add_field(pdf, "Address", loc.get("address"))
    add_field(pdf, "City", loc.get("city"))
    add_field(pdf, "State", loc.get("state"))
    add_field(pdf, "ZIP", loc.get("zip"))
    add_field(pdf, "Location Type", loc.get("location_type"))
    pdf.ln(3)

    # Officer
    officer = report.get("officer", {})
    add_section(pdf, "REPORTING OFFICER", police_blue)
    add_field(pdf, "Name", officer.get("name"))
    add_field(pdf, "Badge Number", officer.get("badge_number"))
    add_field(pdf, "Rank", officer.get("rank"))
    add_field(pdf, "Unit", officer.get("unit"))
    pdf.ln(3)

    # Offenses
    add_section(pdf, "OFFENSES", police_blue)
    for i, offense in enumerate(report.get("offenses", [{}])):
        if i > 0:
            pdf.ln(2)
        add_field(pdf, "UCR Code", offense.get("ucr_offense_code"))
        add_field(pdf, "Description", offense.get("offense_description"))
        add_field(pdf, "Attempted/Completed", offense.get("attempted_or_completed"))
        add_field(pdf, "Weapon/Force", ", ".join(offense.get("weapon_force_used", [])))
        add_field(pdf, "Bias Motivation", offense.get("bias_motivation"))
    pdf.ln(3)

    # Victims
    add_section(pdf, "VICTIM(S)", police_blue)
    for victim in report.get("victims", [{}]):
        add_field(pdf, "Name", victim.get("name"))
        pdf.ln(2)

    # Offenders
    add_section(pdf, "OFFENDER(S)", police_blue)
    for offender in report.get("offenders", [{}]):
        add_field(pdf, "Name", offender.get("name"))
        pdf.ln(2)

    # Narrative
    add_section(pdf, "NARRATIVE", police_blue)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 6, sanitize(report.get("narrative", "")))
    pdf.ln(3)

    add_section(pdf, "SYNOPSIS", police_blue)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 6, sanitize(report.get("synopsis", "")))

    return pdf.output()


def generate_medical_pdf(report: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    med_red = (127, 29, 29)

    # Header
    pdf.set_fill_color(*med_red)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 12, "EMS PATIENT CARE REPORT", ln=True, align="C", fill=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 7, "National EMS Information System (NEMSIS v3.5)", ln=True, align="C", fill=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    # Dispatch
    dispatch = report.get("dispatch", {})
    add_section(pdf, "DISPATCH INFORMATION", med_red)
    add_field(pdf, "Incident #", dispatch.get("incident_number"))
    add_field(pdf, "Call Type", dispatch.get("call_type"))
    add_field(pdf, "Dispatch Date", dispatch.get("dispatch_date"))
    add_field(pdf, "Dispatch Time", dispatch.get("dispatch_time"))
    add_field(pdf, "En Route", dispatch.get("en_route_time"))
    add_field(pdf, "On Scene", dispatch.get("arrived_on_scene_time"))
    add_field(pdf, "Patient Contact", dispatch.get("patient_contact_time"))
    add_field(pdf, "Dispatch Complaint", dispatch.get("dispatch_complaint"))
    add_field(pdf, "Acuity", dispatch.get("dispatch_acuity"))
    pdf.ln(3)

    # Patient
    patient = report.get("patient", {})
    add_section(pdf, "PATIENT DEMOGRAPHICS", med_red)
    add_field(pdf, "Name", patient.get("name"))
    add_field(pdf, "DOB", patient.get("dob"))
    add_field(pdf, "Age", f"{patient.get('age', '')} {patient.get('age_units', '')}".strip())
    add_field(pdf, "Sex", patient.get("sex"))
    add_field(pdf, "Race", patient.get("race"))
    add_field(pdf, "Address", patient.get("address"))
    add_field(pdf, "City", patient.get("city"))
    add_field(pdf, "Insurance", patient.get("insurance"))
    pdf.ln(3)

    # Situation
    situation = report.get("situation", {})
    add_section(pdf, "SITUATION", med_red)
    add_field(pdf, "Chief Complaint", situation.get("chief_complaint"))
    add_field(pdf, "Primary Impression", situation.get("primary_impression"))
    add_field(pdf, "Secondary Impression", situation.get("secondary_impression"))
    add_field(pdf, "Cause of Injury", situation.get("cause_of_injury"))
    add_field(pdf, "Mechanism of Injury", situation.get("mechanism_of_injury"))
    pdf.ln(3)

    # History
    history = report.get("history", {})
    add_section(pdf, "PATIENT HISTORY", med_red)
    add_field(pdf, "Medical History", ", ".join(history.get("medical_history", [])))
    add_field(pdf, "Medications", ", ".join(history.get("current_medications", [])))
    add_field(pdf, "Allergies", ", ".join(history.get("allergies", [])))
    add_field(pdf, "Last Oral Intake", history.get("last_oral_intake"))
    pdf.ln(3)

    # Vitals
    add_section(pdf, "VITAL SIGNS", med_red)
    for v in report.get("vitals", [{}]):
        bp = f"{v.get('blood_pressure_systolic', '')}/{v.get('blood_pressure_diastolic', '')}"
        add_field(pdf, "Time", v.get("taken_time"))
        add_field(pdf, "Blood Pressure", bp)
        add_field(pdf, "Heart Rate", v.get("heart_rate"))
        add_field(pdf, "Respiratory Rate", v.get("respiratory_rate"))
        add_field(pdf, "SpO2", v.get("spo2"))
        add_field(pdf, "GCS Total", v.get("gcs_total"))
        add_field(pdf, "Pain Scale", v.get("pain_scale"))
        pdf.ln(2)

    # Procedures
    add_section(pdf, "PROCEDURES", med_red)
    for p in report.get("procedures", [{}]):
        add_field(pdf, "Procedure", p.get("procedure"))
        add_field(pdf, "Time", p.get("time"))
        add_field(pdf, "Performed By", p.get("performed_by"))
        pdf.ln(2)

    # Medications
    add_section(pdf, "MEDICATIONS ADMINISTERED", med_red)
    for m in report.get("medications_given", [{}]):
        add_field(pdf, "Medication", m.get("medication_name"))
        add_field(pdf, "Dose", f"{m.get('dose', '')} {m.get('unit', '')}".strip())
        add_field(pdf, "Route", m.get("route"))
        add_field(pdf, "Administered By", m.get("administered_by"))
        pdf.ln(2)

    # Disposition
    disposition = report.get("disposition", {})
    add_section(pdf, "DISPOSITION", med_red)
    add_field(pdf, "Transport Disposition", disposition.get("transport_disposition"))
    add_field(pdf, "Destination", disposition.get("transport_destination"))
    add_field(pdf, "Destination Type", disposition.get("destination_type"))
    add_field(pdf, "Transfer of Care Time", disposition.get("transfer_of_care_time"))
    pdf.ln(3)

    # Narrative
    add_section(pdf, "NARRATIVE", med_red)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 6, sanitize(report.get("narrative", "")))

    return pdf.output()
