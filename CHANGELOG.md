# Changelog

## Unreleased

- Email to Jira automation as a Google Apps Script: watches a Gmail address and creates a Jira
  task per new email, with a polling trigger and processed-thread tracking.
- Extracted the pure helpers (summary, description, payload, dedup tracking) into a testable
  file and covered them with `node:test` unit tests, so the logic can be checked without a live
  Jira.
- Hardened the email handling: strips CRLF from outgoing headers to prevent injection, quotes the
  monitored address in the Gmail search, and self-heals a corrupt `processedThreadIds` property.
- Added a local connection check script that verifies Jira credentials and creates one test
  issue, reading `JIRA_*` from `.env`.
- Added project tooling: ESLint config, npm scripts, package metadata, an MIT license, and a
  GitHub Actions CI run (lint, tests, and `npm audit`).
- Documented the dedup behavior, notification body, and token-security limitations in the README.
