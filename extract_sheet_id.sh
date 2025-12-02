#!/bin/bash
# Helper script to extract Google Sheets Spreadsheet ID from URL

if [ -z "$1" ]; then
  echo "Usage: ./extract_sheet_id.sh 'YOUR_GOOGLE_SHEET_URL'"
  echo ""
  echo "Example:"
  echo "  ./extract_sheet_id.sh 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'"
  exit 1
fi

URL="$1"
ID=$(echo "$URL" | sed -n 's|.*/spreadsheets/d/\([^/]*\)/.*|\1|p')

if [ -z "$ID" ]; then
  echo "❌ Could not extract Spreadsheet ID from URL"
  echo "Make sure the URL contains '/spreadsheets/d/'"
  exit 1
fi

echo "✅ Spreadsheet ID found:"
echo "$ID"
echo ""
echo "Add this to your .env file:"
echo "GOOGLE_SHEETS_SPREADSHEET_ID=$ID"
