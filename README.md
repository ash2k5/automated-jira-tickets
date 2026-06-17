# email to jira automation

turns emails sent to a monitored inbox into jira tasks (with attachments) and notifies a
few recipients. runs on google apps script.

this is a generalized copy of an internship project, kept as a reference. it isn't
deployed anywhere; the pure logic is pulled into helpers so it can be unit tested locally.

## how it works

- checks the inbox for unread threads every 10 minutes.
- creates one jira task per thread from the first message: the subject becomes the summary
  (capped at jira's 255 chars), the plain-text body becomes the description, and any
  attachments are uploaded.
- records processed thread ids so replies don't create duplicates; ids older than 30 days
  are purged. skips its own notification mails.
- emails each recipient the new task key and a link.

dedup is per gmail thread, so a request resent in a new thread files a second task (a
duplicate is easy to close; silently dropping a real request isn't). only the first
message's plain-text body is filed.

## use it

paste `src/automation.cjs` into a google apps script project, enable the gmail advanced
service, fill in the `CONFIG` object at the top (jira url, account email + api token,
project key, the monitored inbox, and the notification recipients), run `testSetup` once
to authorize, then `setupTrigger` to run it every 10 minutes.

### token security

the jira api token sits in clear text in `CONFIG`, and the `Basic` auth header is base64
(encoding, not encryption). so:

- use a dedicated, narrowly scoped token, not a personal one.
- limit edit access to the apps script project to people allowed to see the token.
- rotate it if the project is shared, exported, or exposed.

## tests

```bash
npm install
npm test      # unit tests for the pure helpers
npm run lint
```

`npm run check` creates one test issue to verify jira credentials locally (copy
`.env.example` to `.env` and fill in the `JIRA_*` values first).

MIT.
