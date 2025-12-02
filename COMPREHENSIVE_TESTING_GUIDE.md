# Comprehensive Testing Guide

## 🎯 Testing Plan Overview

We'll test the system in 3 phases:
1. **Single Email Test** - Send one email to yourself
2. **Full Pipeline Dry Run** - Test everything without sending emails
3. **End-to-End Test** - Full pipeline with real email sending

---

## 📋 Prerequisites Checklist

Before testing, verify you have:

- [ ] ✅ Google Sheets API configured
- [ ] ✅ Gemini API configured (`USE_GEMINI=true`)
- [ ] ✅ Hunter.io API configured
- [ ] ✅ Gmail API configured (connection tested)
- [ ] ✅ `.env` file with all credentials

---

## 🧪 Phase 1: Test Single Email Send

**Purpose:** Verify Gmail API can send emails

### Step 1: Ensure SEND_EMAILS is FALSE (safety first)
```bash
# Check your .env file
grep SEND_EMAILS .env
# Should show: SEND_EMAILS=false
```

### Step 2: Run the single email test (dry run)
```bash
npm run test:email
```

**Expected:** Should show it's a dry run and exit without sending

### Step 3: Enable email sending and test
```bash
# Edit .env and set:
SEND_EMAILS=true

# Then run:
npm run test:email
```

**Expected:**
- ✅ Email sent successfully
- ✅ Thread ID and Message ID shown
- ✅ Check your inbox for the test email

**What to verify:**
- [ ] Email appears in your Gmail inbox
- [ ] Email has correct subject and body
- [ ] No errors in the logs

---

## 🧪 Phase 2: Full Pipeline Dry Run

**Purpose:** Test the entire pipeline without sending emails

### Step 1: Ensure SEND_EMAILS is FALSE
```bash
# In .env:
SEND_EMAILS=false
```

### Step 2: Run pipeline test with a test job ID
```bash
npm run test:pipeline test-job-001
```

**Or use a real job ID from your Google Sheet:**
```bash
npm run test:pipeline your-actual-job-id
```

**Expected Output:**
- ✅ Job loaded (from Sheets or stub)
- ✅ JD insights extracted
- ✅ Resume and cover letter generated
- ✅ Contacts discovered (from Hunter.io or stub)
- ✅ Contacts scored and filtered
- ✅ Email drafts created
- ✅ Data persisted to Google Sheets
- ⚠️ Emails NOT sent (dry run mode)

**What to verify:**
- [ ] Files generated in `output/` folder
- [ ] Data appears in Google Sheets (contacts, emails, events tabs)
- [ ] Logs show successful completion
- [ ] No errors in the pipeline

**Check generated files:**
```bash
ls -la output/
# Should see folders with job IDs containing:
# - resume.tex
# - cover_letter.tex
```

**Check Google Sheets:**
- Open your Google Sheet
- Check "contacts" tab - should have discovered contacts
- Check "emails" tab - should have email drafts
- Check "events" tab - should have pipeline events

---

## 🧪 Phase 3: End-to-End Test (Real Email Sending)

**⚠️ WARNING: This will send REAL emails to discovered contacts!**

### Step 1: Prepare a test job
- Use a job with a company domain you control
- Or use a test job with contacts you can verify

### Step 2: Enable email sending
```bash
# In .env:
SEND_EMAILS=true
```

### Step 3: Run the full pipeline
```bash
npm run test:pipeline test-job-001
```

**The script will:**
- Wait 5 seconds before proceeding (gives you time to cancel)
- Show a warning that emails will be sent
- Process the job and send emails

**Expected Output:**
- ✅ All previous steps complete
- ✅ Emails sent to contacts
- ✅ Thread IDs and Message IDs logged
- ✅ Email status updated in Google Sheets

**What to verify:**
- [ ] Check your Gmail sent folder
- [ ] Verify emails were sent to correct recipients
- [ ] Check Google Sheets "emails" tab - `sent_at` should be populated
- [ ] Check "events" tab - should have "sent" events

---

## 🔍 Troubleshooting

### Issue: "Insufficient Permission" error
**Solution:** 
- Verify refresh token has `gmail.send` scope
- Re-obtain refresh token from OAuth Playground

### Issue: No contacts discovered
**Solution:**
- Check Hunter.io API key is set
- Verify company domain is valid
- Check Hunter.io API quota

### Issue: Gemini API errors
**Solution:**
- Verify `USE_GEMINI=true` and `GEMINI_API_KEY` is set
- Check API quota/limits
- Verify model name is correct (`gemini-2.0-flash-001`)

### Issue: Google Sheets errors
**Solution:**
- Verify service account has access to the sheet
- Check spreadsheet ID is correct
- Ensure "contacts", "emails", "events" tabs exist

---

## 📊 Testing Checklist

### Single Email Test
- [ ] Dry run works (no email sent)
- [ ] Real email sent successfully
- [ ] Email appears in inbox
- [ ] No errors in logs

### Pipeline Dry Run
- [ ] Job loads correctly
- [ ] Resume and cover letter generated
- [ ] Contacts discovered
- [ ] Email drafts created
- [ ] Data persisted to Sheets
- [ ] No emails sent (SEND_EMAILS=false)

### End-to-End Test
- [ ] All pipeline steps complete
- [ ] Emails sent successfully
- [ ] Email status in Sheets updated
- [ ] Events logged correctly
- [ ] Can verify emails in Gmail

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Single email test sends successfully
2. ✅ Pipeline dry run completes without errors
3. ✅ All data persists to Google Sheets
4. ✅ End-to-end test sends real emails
5. ✅ Email status tracked in Sheets
6. ✅ No errors in any step

---

## 💡 Next Steps After Testing

Once all tests pass:

1. **Monitor email replies** - Set up n8n workflow to track replies
2. **Review generated content** - Check resume/cover letter quality
3. **Optimize contact discovery** - Fine-tune Hunter.io filters
4. **Scale up** - Process multiple jobs from your Google Sheet
5. **Automate** - Set up n8n cron to run daily

---

## 📝 Notes

- Always test with `SEND_EMAILS=false` first
- Use test job IDs before processing real jobs
- Monitor API quotas (Hunter.io, Gemini, Gmail)
- Check Google Sheets regularly for data quality
- Keep logs for debugging

Good luck! 🚀

