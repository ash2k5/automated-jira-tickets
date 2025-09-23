#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

const CONFIG = {
  jiraUrl: process.env.JIRA_URL,
  jiraEmail: process.env.JIRA_EMAIL,
  jiraToken: process.env.JIRA_API_TOKEN,
  jiraProject: process.env.JIRA_PROJECT,
  notificationEmail: process.env.NOTIFICATION_EMAIL || 'team@company.com'
};

async function createJiraTask(subject, body, sender) {
  const taskData = {
    fields: {
      project: { key: CONFIG.jiraProject },
      summary: subject,
      description: `From: ${sender}\nDate: ${new Date().toLocaleString()}\n\n${body}`,
      issuetype: { name: 'Task' }
    }
  };

  const auth = Buffer.from(`${CONFIG.jiraEmail}:${CONFIG.jiraToken}`).toString('base64');

  const response = await fetch(`${CONFIG.jiraUrl}/rest/api/2/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status} - ${await response.text()}`);
  }

  const responseData = await response.json();

  return {
    key: responseData.key,
    url: `${CONFIG.jiraUrl}/browse/${responseData.key}`
  };
}

async function testSetup() {
  console.log('Testing local Jira connection...');

  try {
    const testTask = await createJiraTask(
      'Test: Local Node.js Setup Verification',
      'This is a test task created during local setup. You can delete this task.',
      'local-test@system'
    );

    console.log('Jira connection successful:', testTask.key);
    console.log('Test task URL:', testTask.url);
    console.log('Local setup test completed successfully!');

  } catch (error) {
    console.error('Setup test failed:', error.message);
  }
}

testSetup();