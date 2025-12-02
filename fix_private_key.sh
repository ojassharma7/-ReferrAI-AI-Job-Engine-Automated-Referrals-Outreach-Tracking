#!/bin/bash
# Helper to fix Google Sheets private key format in .env

echo "This script will help you fix the private key format."
echo ""
echo "Your private key from the JSON file should look like:"
echo '  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"'
echo ""
echo "In your .env file, it should be:"
echo 'GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"'
echo ""
echo "Key points:"
echo "  - NO space after ="
echo "  - Must be in double quotes"
echo "  - Must include BEGIN and END lines"
echo "  - Use \\n for newlines (not actual newlines)"
echo ""
echo "If you paste your private key here, I can help format it correctly."
