# Email to Jira Automation

Automatically creates Jira tasks from emails sent to a monitored email address and notifies designated team members.

## Overview

This project provides a complete email-to-Jira automation solution using Google Apps Script. It monitors a specific email address for incoming requests and automatically converts them into Jira tasks with notifications.

## Production File

**`automation.js`** - Google Apps Script file for deployment

## Pre-Deployment Setup & Testing

### 1. Local Testing (Optional)
```bash
# Install dependencies for local testing
npm install

# Copy environment template and edit with your credentials
cp .env.example .env

# Quick Jira connection test
node test.js

# Full local testing (requires email setup)
npm start
```

### 2. Google Apps Script Testing
1. **Go to:** https://script.google.com
2. **Create New Project** named "Email-to-Jira-Automation"
3. **Copy entire content** from `automation.js`
4. **Update configuration** in the `CONFIG` object with your settings
5. **Test the setup:**
   - Run function: `testSetup()`
   - Check console for success messages
   - Verify test task created in your Jira project
   - Confirm notification sent to designated email
6. **Activate automation:**
   - Run function: `setupTrigger()`
   - Automation is now live - checks every 10 minutes

## How It Works

### For Team Members:
- Send email to your configured monitoring address
- Email subject becomes Jira task title
- Email body becomes task description
- Task is created unassigned in your specified Jira project

### Gmail Notification:
- Receives notification email for each new task
- Email includes task number, subject, sender, and direct link

### Automation Details:
- Checks every 10 minutes for new emails
- **Only processes emails from the last 15 minutes** (prevents old email processing)
- Marks processed emails as read
- Sends notifications using Google Apps Script's built-in Gmail service

## Configuration

All settings are configured in the `CONFIG` object in `email-to-jira.js`:
- **Jira URL:** `https://your-domain.atlassian.net`
- **Jira Project:** `YOUR_PROJECT_KEY`
- **Jira Email:** `your-jira-user@company.com`
- **Notification Emails:** `['team-member@company.com']`
- **Monitored Email:** `support@company.com`

## Project Structure

```
├── automation.js              # Google Apps Script file (PRODUCTION)
├── test.js                    # Quick Jira connection test
├── package.json               # Dependencies for local testing
├── .env.example               # Configuration template
└── README.md                  # This file
```

## Features

The `automation.js` file provides:
- Complete email-to-Jira automation
- Robust error handling and logging
- Gmail API integration with fallback mechanisms
- Automatic trigger setup for scheduled execution
- Test verification functions
- Timestamp-based filtering to prevent duplicate processing
- Multi-recipient notification system

## Environment Variables

Create a `.env` file for local testing:
```
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-jira-user@company.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT=YOUR_PROJECT_KEY
EMAIL_PASSWORD=your_email_app_password
```

## License

MIT License - feel free to use and modify as needed.
