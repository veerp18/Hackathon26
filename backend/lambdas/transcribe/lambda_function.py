import boto3, base64, json, uuid, time, urllib.request

s3 = boto3.client("s3")
transcribe = boto3.client("transcribe")

BUCKET = "911-audio-temp"

def lambda_handler(event, context):
    # 1. Parse body
    if isinstance(event.get("body"), str):
        body = json.loads(event["body"])
    elif isinstance(event.get("body"), dict):
        body = event["body"]
    else:
        body = event

    # 2. Decode audio
    audio_data = base64.b64decode(body["audio"])
    job_name = f"911-job-{uuid.uuid4().hex}"

    # 3. Upload audio to S3
    s3.put_object(
        Bucket=BUCKET,
        Key=f"{job_name}.m4a",
        Body=audio_data
    )

    # 4. Start transcription job
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": f"s3://{BUCKET}/{job_name}.m4a"},
        MediaFormat="m4a",
        LanguageCode="en-US"
    )

    # 5. Poll until done
    while True:
        result = transcribe.get_transcription_job(
            TranscriptionJobName=job_name
        )
        status = result["TranscriptionJob"]["TranscriptionJobStatus"]

        if status == "COMPLETED":
            transcript_url = result["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            break
        elif status == "FAILED":
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "Transcription failed"})
            }

        time.sleep(2)

    # 6. Fetch transcript text
    with urllib.request.urlopen(transcript_url) as r:
        transcript_data = json.loads(r.read())

    text = transcript_data["results"]["transcripts"][0]["transcript"]

    # 7. Return transcript
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        "body": json.dumps({"transcript": text})
    }