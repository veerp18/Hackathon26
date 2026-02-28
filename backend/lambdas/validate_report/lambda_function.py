POLICE_REQUIRED_FIELDS = [
    "ori_number",
    "incident_number",
    "incident_date",
    "incident_time",
    "report_status",
    "location.address",
    "location.city",
    "location.state",
    "location.location_type",
    "officer.name",
    "officer.badge_number",
    "officer.rank",
    "officer.unit",
    "offenses[0].ucr_offense_code",
    "offenses[0].offense_description",
    "offenses[0].attempted_or_completed",
    "victims[0].name",
    "victims[0].age",
    "victims[0].sex",
    "victims[0].injury_type",
    "victims[0].relationship_to_offender",
    "offenders[0].name",
    "offenders[0].age",
    "offenders[0].sex",
    "synopsis",
    "narrative",
    "domestic_violence"
]

MEDICAL_REQUIRED_FIELDS = [
    "dispatch.incident_number",
    "dispatch.dispatch_date",
    "dispatch.dispatch_time",
    "dispatch.unit_notified_time",
    "dispatch.en_route_time",
    "dispatch.arrived_on_scene_time",
    "dispatch.patient_contact_time",
    "dispatch.call_type",
    "dispatch.dispatch_complaint",
    "agency.ems_agency_name",
    "agency.unit_number",
    "agency.unit_type",
    "agency.crew[0].name",
    "agency.crew[0].certification_level",
    "patient.name",
    "patient.dob",
    "patient.age",
    "patient.sex",
    "patient.address",
    "scene.incident_address",
    "scene.scene_type",
    "scene.number_of_patients",
    "situation.chief_complaint",
    "situation.primary_impression",
    "situation.mechanism_of_injury",
    "history.medical_history",
    "history.current_medications",
    "history.allergies",
    "vitals[0].taken_time",
    "vitals[0].blood_pressure_systolic",
    "vitals[0].blood_pressure_diastolic",
    "vitals[0].heart_rate",
    "vitals[0].respiratory_rate",
    "vitals[0].spo2",
    "vitals[0].gcs_total",
    "vitals[0].pain_scale",
    "disposition.transport_disposition",
    "disposition.transport_destination",
    "disposition.destination_type",
    "disposition.transfer_of_care_time",
    "narrative"
]

import boto3
import json

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

POLICE_REQUIRED_FIELDS = [
    "incident_number",
    "incident_date",
    "incident_time",
    "location.address",
    "officer.name",
    "officer.badge_number",
    "offenses[0].offense_description",
    "victims[0].name",
    "narrative"
]

MEDICAL_REQUIRED_FIELDS = [
    "dispatch.incident_number",
    "dispatch.dispatch_date",
    "dispatch.dispatch_time",
    "patient.name",
    "patient.dob",
    "situation.chief_complaint",
    "vitals[0].blood_pressure_systolic",
    "vitals[0].heart_rate",
    "vitals[0].respiratory_rate",
    "vitals[0].spo2",
    "disposition.transport_destination",
    "narrative"
]

def lambda_handler(event, context):

    # 1. Get report from request
    body = json.loads(event["body"])
    report = body["report"]
    report_type = body["report_type"]  # "police" or "medical"

    required_fields = POLICE_REQUIRED_FIELDS if report_type == "police" else MEDICAL_REQUIRED_FIELDS

    # 2. Build prompt
    prompt = f"""You are a strict {report_type} report reviewer for 911 responders.

Review this report JSON and return a JSON object with two arrays:
1. "missing_fields" — list of required fields that are empty or missing
2. "issues" — list of inconsistencies, unclear entries, or problems found

Required fields to check:
{json.dumps(required_fields, indent=2)}

Be specific. For each issue include:
- "field": the field name
- "message": what is wrong or missing
- "severity": "required" | "warning"

Return ONLY valid JSON like this:
{{
  "missing_fields": [
    {{"field": "patient.name", "message": "Patient name is required", "severity": "required"}}
  ],
  "issues": [
    {{"field": "narrative", "message": "Narrative is too short and lacks detail", "severity": "warning"}}
  ],
  "is_complete": false
}}

Report to review:
{json.dumps(report, indent=2)}"""

    # 3. Call Bedrock
    response = bedrock.invoke_model(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [{"role": "user", "content": prompt}]
        })
    )

    # 4. Parse response
    result = json.loads(response["body"].read())
    extracted = result["content"][0]["text"]

    # 5. Strip markdown if needed
    extracted = extracted.strip()
    if extracted.startswith("```"):
        extracted = extracted.split("```")[1]
        if extracted.startswith("json"):
            extracted = extracted[4:]
    extracted = extracted.strip()

    validation = json.loads(extracted)

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        "body": json.dumps(validation)
    }