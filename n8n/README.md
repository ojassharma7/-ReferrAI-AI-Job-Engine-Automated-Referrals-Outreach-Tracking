# n8n Workflows for ReferrAI

This directory contains importable n8n workflow JSON files.

## Workflows

### 1. `referral-engine-main.json` - Main Daily Referral Engine

**Purpose:** Orchestrates the daily job processing pipeline.

**Flow:**
- Daily cron trigger (10:00 AM)
- Reads jobs from Google Sheets
- Filters to `ready` or `in_progress` status
- For each job:
  - Builds JobRow structure
  - Extracts JD insights
  - Generates file paths
  - Executes `npm run pipeline <job_id>` (runs full Node.js pipeline)
  - Updates job status to `completed`

**Credentials Required:**
- Google Sheets (ReferrAI) - OAuth2 or Service Account

**Environment Variables:**
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `HUNTER_API_KEY` (optional)
- `GEMINI_API_KEY` (optional)
- `USE_GEMINI` (optional)

**Note:** Update the Execute Command node path to match your project location.

### 2. `referral-reply-monitor.json` - Gmail Reply Monitor

**Purpose:** Monitors Gmail for replies and updates tracking sheets.

**Flow:**
- Cron trigger (every 15 minutes)
- Fetches recent Gmail messages (last 24 hours, unread)
- Maps replies (extracts thread_id, from, subject, snippet)
- Reads emails sheet
- Looks up matching email by thread_id
- If matched:
  - Checks if reply is positive (keyword-based)
  - Updates `emails.status` → `"reply"`
  - Updates `contacts.status` → `"replied"`, `followup_stage` → `99`
  - Appends event to `events` sheet

**Credentials Required:**
- Google Sheets (ReferrAI)
- Gmail (ReferrAI) - OAuth2

**Note:** You may need to add a Merge node in the n8n UI to properly combine the replies and emails data streams before the lookup function. Alternatively, restructure to use Item Lists/Split In Batches pattern.

## Importing Workflows

1. Open n8n UI
2. Go to **Workflows** → **Import** → **From file**
3. Select the JSON file you want to import
4. Click **Import**
5. Configure credentials for each node
6. Update paths and environment variables as needed
7. Test manually before enabling cron triggers

## Configuration Checklist

- [ ] Import both workflow JSON files
- [ ] Set up Google Sheets credential (OAuth2 or Service Account)
- [ ] Set up Gmail credential (OAuth2)
- [ ] Configure environment variables in n8n
- [ ] Update Execute Command path in main workflow
- [ ] Test workflows manually
- [ ] Enable cron triggers
- [ ] Monitor first few executions

## Troubleshooting

**Workflow fails to import:**
- Ensure JSON is valid (use a JSON validator)
- Check n8n version compatibility

**Credentials not working:**
- Verify OAuth2 scopes are correct
- For Service Account, ensure JSON key is properly formatted

**Execute Command fails:**
- Check that Node.js and npm are available in n8n's environment
- Verify the project path is correct
- Ensure all dependencies are installed (`npm install`)

**Reply monitor not finding matches:**
- Verify thread_id format matches between Gmail and Sheets
- Check that emails sheet has thread_id column populated
- Consider adding a Merge node to properly combine data streams

