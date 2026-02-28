import boto3, base64, json, uuid, time, urllib.request

s3 = boto3.client("s3")
transcribe = boto3.client("transcribe")

BUCKET = "911-audio-temp"

def lambda_handler(event, context):
    # 1. Decode audio from request
    body = json.loads(event["body"])
    audio_data = base64.b64decode(body["audio"])
    job_name = f"911-job-{uuid.uuid4().hex}"

    # 2. Upload audio to S3
    s3.put_object(
        Bucket=BUCKET,
        Key=f"{job_name}.webm",
        Body=audio_data
    )

    # 3. Start transcription job
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": f"s3://{BUCKET}/{job_name}.webm"},
        MediaFormat="webm",
        LanguageCode="en-US"
    )

    # 4. Poll until done
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

    # 5. Fetch transcript text
    with urllib.request.urlopen(transcript_url) as r:
        transcript_data = json.loads(r.read())

    text = transcript_data["results"]["transcripts"][0]["transcript"]

