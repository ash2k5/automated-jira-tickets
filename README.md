# Email to Jira Automation

Turns emails sent to a monitored inbox into Jira tasks (with attachments) and notifies a few
recipients. Runs on Google Apps Script.

This is a generalized copy of an internship project, kept as a reference. It isn't deployed
anywhere; the pure logic is pulled into helpers so it can be unit tested locally.

## How it works

- Checks the inbox for unread threads every 10 minutes.
- Creates one Jira task per thread from the first message: the subject becomes the summary
  (capped at Jira's 255 chars), the plain-text body becomes the description, and any
  attachments are uploaded.
- Records processed thread IDs so replies don't create duplicates; IDs older than 30 days are
  purged. Skips its own notification mail.
- Emails each recipient the new task key and a link.

Dedup is per Gmail thread, so a request resent in a new thread files a second task (a
duplicate is easy to close; silently dropping a real request isn't). Only the first message's
plain-text body is filed.

## Use it

Paste `src/automation.cjs` into a Google Apps Script project, enable the Gmail advanced
service, fill in the `CONFIG` object at the top (Jira URL, account email + API token, project
key, the monitored inbox, and the notification recipients), run `testSetup` once to authorize,
then `setupTrigger` to run it every 10 minutes.

### Token security

The Jira API token sits in clear text in `CONFIG`, and the `Basic` auth header is base64
(encoding, not encryption). So:

- Use a dedicated, narrowly scoped token, not a personal one.
- Limit edit access to the Apps Script project to people allowed to see the token.
- Rotate it if the project is shared, exported, or exposed.

## Tests

```bash
npm install
npm test      # unit tests for the pure helpers
npm run lint
```

`npm run check` creates one test issue to verify Jira credentials locally (copy `.env.example`
to `.env` and fill in the `JIRA_*` values first).

MIT.
