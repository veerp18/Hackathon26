#!/bin/bash
set -e
cd "$(dirname "$0")/lambdas/export_pdf"

echo "Cleaning old packages..."
rm -rf fpdf2 fpdf2-*.dist-info reportlab reportlab-*.dist-info PIL Pillow-*.dist-info

echo "Installing fpdf2..."
pip install -r requirements.txt -t . -q

echo "Zipping..."
zip -r /tmp/export_pdf_deploy.zip . > /dev/null

echo "Deploying to Lambda..."
aws lambda update-function-code \
  --function-name export-pdf \
  --zip-file fileb:///tmp/export_pdf_deploy.zip \
  --region us-east-1 > /dev/null

echo "Done! export-pdf redeployed."
