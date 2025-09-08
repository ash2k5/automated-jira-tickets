# Email to Jira Automation 

Automatically creates Jira tasks from emails sent to `itrequests@nrinstitute.org` and notifies the designated team member.

## Final Production File

**`email-to-jira.js`** - Main Google Apps Script file ready for Google Workspace Admin deployment

## Pre-Deployment Setup & Testing

### 1. Local Testing (Optional)
```bash
# Install dependencies for local testing
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# Test locally (Node.js version)
npm start
```

### 2. Google Apps Script Testing
1. **Go to:** https://script.google.com
2. **Create New Project** named "Email-to-Jira-Automation"
3. **Copy entire content** from `email-to-jira.js`
4. **Test the setup:**
   - Run function: `testSetup()`
   - Check console for success messages
   - Verify test task created in Jira NRTT project
   - Confirm notification sent to `bwilson@nationalreview.com`
5. **Activate automation:**
   - Run function: `setupTrigger()`
   - Automation is now live - checks every 10 minutes

## How It Works

### For Team Members:
- Send email to: `itrequests@nrinstitute.org`
- Email subject becomes Jira task title
- Email body becomes task description  
- Task is created unassigned in NRTT project

### Gmail Notification:
- Receives notification email for each new task
- Email includes task number, subject, sender, and direct link

### Automation Details:
- Checks every 10 minutes for new emails
- Processes unread emails only
- Marks processed emails as read
- Sends notifications using Google Apps Script's built-in Gmail service

## Configuration

All settings are configured in the `CONFIG` object in `email-to-jira.js`:
- **Jira URL:** `https://nationalreview.atlassian.net`
- **Jira Project:** `NRTT`
- **Jira Email:** `asantosh@nrinstitute.org`
- **Notification Email:** `bwilson@nationalreview.com`
- **Monitored Email:** `itrequests@nrinstitute.org`

## Project Structure

```
├── config/
│   └── config.js              # Application configuration (for local testing)
├── src/
│   └── notification-service.js # Email notifications (for local testing)
├── email-to-jira.js           # Main Google Apps Script file (PRODUCTION)
├── index.js                   # Node.js version for local testing
├── package.json               # Dependencies for local testing
├── .env.example               # Configuration template  
└── README.md                  # This file
```


The `email-to-jira.js` file contains:
- All required configuration
- Error handling  
- Logging 
- Google Apps Script code
- Gmail service integration
- Automatic trigger setup
- Test verification function
