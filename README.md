# Email to Jira Automation

Converts emails sent to a monitored inbox into Jira tasks, including attachments, and notifies designated team members. Runs on Google Apps Script.

## Prerequisites

- A Google account with access to the Gmail inbox to monitor
- A Jira Cloud account and API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Node.js 18+ (only for the optional local connection test)

## Deploy (Google Apps Script)

1. Open https://script.google.com and create a new project.
2. Copy the contents of `src/automation.js` into the project editor.
3. Enable the Gmail advanced service: Services, add "Gmail API".
4. Edit the `CONFIG` object at the top of the file with your values (see Configuration below).
5. Run `testSetup` once and approve the requested authorization scopes. Confirm a test task appears in your Jira project.
6. Run `setupTrigger` to schedule processing every 10 minutes.

## How it works

- Searches the monitored inbox for unread threads every 10 minutes.
- Creates one Jira task per thread: the subject becomes the summary, the body becomes the description.
- Uploads any email attachments to the created task.
- Records processed thread IDs in Script Properties so replies do not create duplicate tasks. IDs older than 30 days are purged automatically.
- Skips messages sent from the monitored address so its own notifications are not reprocessed.
- Emails each configured recipient the new task key and a direct link.

## Configuration

Set these in the `CONFIG` object in `src/automation.js`:

| Setting | Description |
| --- | --- |
| `jiraUrl` | Jira Cloud base URL |
| `jiraEmail` | Jira account email used for API auth |
| `jiraToken` | Jira API token |
| `jiraProject` | Target Jira project key |
| `monitoredEmail` | Inbox address that is watched |
| `notificationEmails` | Recipients of new-task notifications |

## Local connection test (optional)

Verifies Jira credentials without deploying.

```bash
npm install
cp .env.example .env
npm test
```

Fill `.env` with the `JIRA_*` values before running. The required variables are listed in `.env.example`.

## Project structure

```
src/automation.js   Google Apps Script deployment file
tests/test.js       Local Jira connection test (Node)
.env.example        Local test configuration template
```

## License

MIT
