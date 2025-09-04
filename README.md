# Email to Jira Automation

A Node.js automation script that monitors an email inbox and automatically creates Jira tasks from incoming emails.

## Features

- **Email Processing**: Monitors IMAP inbox for new emails
- **Jira Integration**: Creates tasks with email subject as title and body as description
- **Notifications**: Sends email notifications when tasks are created (includes Jira task link)
- **Automated Scheduling**: Runs on configurable intervals (default: every 10 minutes)
- **Logging**: Comprehensive logging of all processing activities

## Requirements

- Node.js 16.0.0 or higher
- Access to an IMAP email server (Gmail, Office 365, etc.)
- Jira Cloud instance with API access
- SMTP server for sending notifications

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your settings
4. Run the automation:
   ```bash
   npm start
   ```

## Configuration

Create a `.env` file with the following variables:

### Email Configuration
- `EMAIL_USER`: Email address to monitor (e.g., itrequests@nrinstitute.org)
- `EMAIL_PASSWORD`: Email account password or app-specific password
- `EMAIL_HOST`: IMAP server hostname (default: imap.gmail.com)
- `EMAIL_PORT`: IMAP server port (default: 993)

### SMTP Configuration (for notifications)
- `SMTP_HOST`: SMTP server hostname (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `SMTP_FROM`: From address for notifications

### Jira Configuration
- `JIRA_URL`: Your Jira instance URL (e.g., https://company.atlassian.net)
- `JIRA_EMAIL`: Your Jira account email
- `JIRA_API_TOKEN`: Jira API token ([Generate here](https://id.atlassian.com/manage-profile/security/api-tokens))
- `JIRA_PROJECT_KEY`: Project key where tasks will be created (e.g., IT)
- `JIRA_ISSUE_TYPE`: Type of issue to create (default: Task)

### Other Settings
- `NOTIFICATION_EMAIL`: Email address to receive notifications (default: bwilson@nationalreview.com)
- `CHECK_INTERVAL`: How often to check for emails in minutes (default: 10)
- `RUN_ONCE`: Set to "true" to run once and exit (useful for testing)

## Usage

### Start the automation (continuous running)
```bash
npm start
```

### Run once for testing
```bash
RUN_ONCE=true npm start
```

### Development mode
```bash
npm run dev
```

## How it Works

1. **Email Monitoring**: Connects to IMAP server and searches for unread emails
2. **Email Processing**: For each new email:
   - Extracts subject, body, and sender information
   - Creates a Jira task with:
     - Subject becomes the task title
     - Body becomes the task description
     - Sender information is included in the description
     - Task is not assigned to anyone
3. **Notification**: Sends an email notification to the configured address with:
   - Task details (ID, subject, sender)
   - Direct link to the created Jira task
4. **Cleanup**: Marks processed emails as read to avoid reprocessing

## Deployment Options

### PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start automation.js --name "email-to-jira"
pm2 startup
pm2 save
```

### Docker
```bash
docker build -t email-to-jira .
docker run -d --env-file .env email-to-jira
```

### Systemd Service
Create `/etc/systemd/system/email-to-jira.service`:
```ini
[Unit]
Description=Email to Jira Automation
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/email-to-jira-automation
ExecStart=/usr/bin/node automation.js
EnvironmentFile=/path/to/email-to-jira-automation/.env
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

### Common Issues

1. **IMAP Connection Errors**
   - Verify email credentials and server settings
   - Enable "Less secure app access" for Gmail or use App Password
   - Check firewall settings

2. **Jira API Errors**
   - Verify Jira URL, email, and API token
   - Ensure user has permission to create issues in the project
   - Check project key and issue type

3. **SMTP Errors**
   - Verify SMTP credentials and server settings
   - Use App Password for Gmail
   - Check authentication method requirements

### Logging

The application provides detailed console logging including:
- Connection status
- Email processing results
- Jira task creation status
- Notification delivery status
- Error details

## Security Considerations

- Store sensitive credentials in environment variables, never in code
- Use app-specific passwords where available
- Restrict API token permissions to minimum required
- Run with minimal system privileges
- Regularly rotate API tokens and passwords

## License

MIT