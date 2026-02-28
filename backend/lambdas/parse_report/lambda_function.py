import boto3
import json
import uuid
from datetime import datetime, timezone

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("Reports")

POLICE_SCHEMA = {
    "ori_number": "",
    "incident_number": "",
    "report_date": "",
    "incident_date": "",
    "incident_time": "",
    "report_status": "",
    "location": {
        "address": "",
        "city": "",
        "state": "",
        "zip": "",
        "location_type": ""
    },
    "officer": {
        "name": "",
        "badge_number": "",
        "rank": "",
        "unit": ""
    },
    "offenses": [
        {
            "ucr_offense_code": "",
            "offense_description": "",
            "attempted_or_completed": "",
            "location_type": "",
            "weapon_force_used": [],
            "bias_motivation": ""
        }
    ],
    "victims": [
        {
            "victim_sequence_number": "",
            "name": "",
            "dob": "",
            "age": "",
            "sex": "",
            "race": "",
            "ethnicity": "",
            "injury_type": [],
            "relationship_to_offender": ""
        }
    ],
    "offenders": [
        {
            "offender_sequence_number": "",
            "name": "",
            "dob": "",
            "age": "",
            "sex": "",
            "race": "",
            "ethnicity": "",
            "suspected_drug_use": False,
            "gang_affiliation": ""
        }
    ],
    "arrestee": {
        "name": "",
        "dob": "",
        "sex": "",
        "race": "",
        "arrest_date": "",
        "arrest_type": "",
        "charges": [],
        "armed_with": ""
    },
    "property": [
        {
            "loss_type": "",
            "description": "",
            "value": "",
            "recovered_value": ""
        }
    ],
    "synopsis": "",
    "narrative": "",
    "use_of_force": False,
    "domestic_violence": False,
    "referred_to": ""
}

MEDICAL_SCHEMA = {
    "dispatch": {
        "incident_number": "",
        "dispatch_date": "",
        "dispatch_time": "",
        "unit_notified_time": "",
        "en_route_time": "",
        "arrived_on_scene_time": "",
        "patient_contact_time": "",
        "transport_time": "",
        "arrived_at_destination_time": "",
        "call_type": "",
        "dispatch_complaint": "",
        "dispatch_acuity": ""
    },
    "agency": {
        "ems_agency_name": "",
        "unit_number": "",
        "unit_type": "",
        "crew": [
            {
                "name": "",
                "certification_level": ""
            }
        ]
    },
    "patient": {
        "name": "",
        "dob": "",
        "age": "",
        "age_units": "",
        "sex": "",
        "race": "",
        "ethnicity": "",
        "address": "",
        "city": "",
        "state": "",
        "zip": "",
        "phone": "",
        "ssn_last4": "",
        "insurance": ""
    },
    "scene": {
        "incident_address": "",
        "city": "",
        "state": "",
        "zip": "",
        "gps_lat": "",
        "gps_lon": "",
        "scene_type": "",
        "number_of_patients": ""
    },
    "situation": {
        "chief_complaint": "",
        "primary_impression": "",
        "secondary_impression": "",
        "cause_of_injury": "",
        "mechanism_of_injury": "",
        "provider_primary_impression_code": ""
    },
    "history": {
        "medical_history": [],
        "current_medications": [],
        "allergies": [],
        "last_oral_intake": "",
        "alcohol_drug_use_indicators": []
    },
    "vitals": [
        {
            "taken_time": "",
            "blood_pressure_systolic": "",
            "blood_pressure_diastolic": "",
            "heart_rate": "",
            "respiratory_rate": "",
            "spo2": "",
            "gcs_eye": "",
            "gcs_verbal": "",
            "gcs_motor": "",
            "gcs_total": "",
            "temperature": "",
            "blood_glucose": "",
            "pain_scale": "",
            "pupils": "",
            "skin_color": "",
            "skin_condition": "",
            "ecg_rhythm": ""
        }
    ],
    "procedures": [
        {
            "time": "",
            "procedure": "",
            "successful": True,
            "performed_by": ""
        }
    ],
    "medications_given": [
        {
            "time": "",
            "medication_name": "",
            "dose": "",
            "unit": "",
            "route": "",
            "administered_by": ""
        }
    ],
    "cardiac_arrest": {
        "occurred": False,
        "etiology": "",
        "witnessed_by": "",
        "cpr_provided_prior_to_ems": False,
        "rosc_achieved": False,
        "rosc_time": ""
    },
    "disposition": {
        "transport_disposition": "",
        "transport_destination": "",
        "destination_type": "",
        "reason_for_destination": "",
        "transfer_of_care_time": "",
        "receiving_facility_staff_name": ""
    },
    "narrative": ""
}


def detect_report_type(transcript: str) -> str:
    prompt = f"""Based on this 911 responder voice transcript, determine if this is a police incident report or a medical/EMS report.
Return ONLY one word: either "police" or "medical"

Transcript:
{transcript}"""

    response = bedrock.invoke_model(
        modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": prompt}]
        })
    )
    result = json.loads(response["body"].read())
    report_type = result["content"][0]["text"].strip().lower()
    return "medical" if "medical" in report_type else "police"


def lambda_handler(event, context):

    # 1. Parse body (handles both string and dict from API Gateway)
    if isinstance(event.get("body"), str):
        body = json.loads(event["body"])
    elif isinstance(event.get("body"), dict):
        body = event["body"]
    else:
        body = event

    transcript = body["transcript"]
    user_id = body.get("user_id", "unknown")

    # 2. Auto detect report type if not provided
    report_type = body.get("report_type") or detect_report_type(transcript)
    print(f"Report type detected: {report_type}")

    # 3. Pick the right schema
    schema = POLICE_SCHEMA if report_type == "police" else MEDICAL_SCHEMA

    # 4. Build prompt
    prompt = f"""You are a {report_type} report assistant for 911 responders.
Extract information from this voice transcript and map it to the JSON schema.
Only fill in fields that are clearly mentioned. Leave others as empty string.
Return ONLY valid JSON, no explanation, no markdown backticks.

Schema:
{json.dumps(schema, indent=2)}

Transcript:
{transcript}"""

    # 5. Call Bedrock
    response = bedrock.invoke_model(
        modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        })
    )

    # 6. Parse response
    result = json.loads(response["body"].read())
    extracted = result["content"][0]["text"]

    # 7. Strip markdown if model wraps in ```json
    extracted = extracted.strip()
    if extracted.startswith("```"):
        extracted = extracted.split("```")[1]
        if extracted.startswith("json"):
            extracted = extracted[4:]
    extracted = extracted.strip()

    parsed_fields = json.loads(extracted)

    # 7. Save to DynamoDB
    report_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    table.put_item(Item={
        "user_id": user_id,
        "timestamp": timestamp,
        "report_id": report_id,
        "report_type": report_type,
        "fields": json.dumps(parsed_fields)  # store as JSON string to avoid DynamoDB type issues
    })

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "fields": parsed_fields,
            "report_type": report_type,
            "report_id": report_id,
            "timestamp": timestamp
        })
    }
