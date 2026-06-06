# Email to Jira Automation

Converts emails sent to a monitored inbox into Jira tasks, including attachments, and notifies designated team members. Runs on Google Apps Script.

This is a generalized copy of an internship project, kept as a reference. It is not deployed anywhere; the pure logic is extracted into helpers so it can be unit tested locally.

## Prerequisites

- A Google account with access to the Gmail inbox to monitor
- A Jira Cloud account and API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Node.js 18+ (only for the tests and the optional local connection check)

## Deploy (Google Apps Script)

1. Open https://script.google.com and create a new project.
2. Copy the contents of `src/automation.cjs` into the project editor. The `module.exports` block at the bottom is inert in Apps Script and can be left in place.
3. Enable the Gmail advanced service: Services, add "Gmail API".
4. Edit the `CONFIG` object at the top of the file with your values (see Configuration below).
5. Run `testSetup` once and approve the requested authorization scopes. Confirm a test task appears in your Jira project.
6. Run `setupTrigger` to schedule processing every 10 minutes.

## How it works

- Searches the monitored inbox for unread threads every 10 minutes.
- Creates one Jira task per thread: the subject becomes the summary (capped at Jira's 255-character limit), the body becomes the description.
- Uploads any email attachments to the created task.
- Records processed thread IDs in Script Properties so replies do not create duplicate tasks. IDs older than 30 days are purged automatically.
- Skips messages sent from the monitored address so its own notifications are not reprocessed.
- Emails each configured recipient the new task key and a direct link.

## Configuration

Set these in the `CONFIG` object in `src/automation.cjs`:

| Setting | Description |
| --- | --- |
| `jiraUrl` | Jira Cloud base URL |
| `jiraEmail` | Jira account email used for API auth |
| `jiraToken` | Jira API token |
| `jiraProject` | Target Jira project key |
| `monitoredEmail` | Inbox address that is watched |
| `notificationEmails` | Recipients of new-task notifications |

## Tests and linting

```bash
npm install
npm test      # unit tests for the pure helpers (node --test)
npm run lint  # eslint
```

## Local connection check (optional)

Creates one test issue to verify Jira credentials without deploying.

```bash
cp .env.example .env   # fill in the JIRA_* values
npm run check
```

## Project structure

```
src/automation.cjs        Apps Script deploy file + pure helpers
test/automation.test.js   Unit tests for the helpers
scripts/check-connection.js  Local Jira credential check (Node)
.env.example              Local check configuration template
```

## License

MIT, see [LICENSE](LICENSE).
