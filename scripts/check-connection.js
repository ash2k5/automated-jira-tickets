#!/usr/bin/env node
// Local Jira credential check. Creates one test issue using the JIRA_* env vars.
import { Buffer } from 'node:buffer';
import dotenv from 'dotenv';

import automation from '../src/automation.cjs';

dotenv.config({ quiet: true });

const { buildIssuePayload, parseIssueResult } = automation;

async function checkConnection() {
  const required = ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing required env vars: ' + missing.join(', '));
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.JIRA_URL;
  const payload = buildIssuePayload(
    'Test: Local Jira connection check',
    'Created by scripts/check-connection.js to verify credentials. Safe to delete.',
    'local-check@system',
    process.env.JIRA_PROJECT,
    new Date()
  );
  const auth = Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');

  try {
    const response = await fetch(baseUrl + '/rest/api/2/issue', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('Jira API error: ' + response.status + ' - ' + text);
      process.exitCode = 1;
      return;
    }

    const issue = parseIssueResult(text, baseUrl);
    console.log('Jira connection successful: ' + issue.key);
    console.log('Test task: ' + issue.url);
  } catch (error) {
    console.error('Connection check failed: ' + error.message);
    process.exitCode = 1;
  }
}

checkConnection();
