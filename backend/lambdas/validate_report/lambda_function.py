import boto3
import json

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

POLICE_REQUIRED_FIELDS = [
    "incident_date",
    "incident_time",
    "location.address",
    "officer.name",
    "officer.badge_number",
    "offenses[0].offense_description",
    "narrative"
]

MEDICAL_REQUIRED_FIELDS = [
    "dispatch.dispatch_date",
    "dispatch.dispatch_time",
    "patient.name",
    "situation.chief_complaint",
    "vitals[0].blood_pressure_systolic",
    "vitals[0].heart_rate",
    "vitals[0].spo2",
    "disposition.transport_destination",
    "narrative"
]

def lambda_handler(event, context):

    # 1. Parse body
    if isinstance(event.get("body"), str):
        body = json.loads(event["body"])
    elif isinstance(event.get("body"), dict):
        body = event["body"]
    else:
        body = event

    report = body["report"]
    report_type = body["report_type"]

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
        modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
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