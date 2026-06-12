/* exported processEmails, setupTrigger, testSetup */
// Google Apps Script: email -> Jira task automation.
// Paste into the Apps Script editor. The module.exports block at the bottom is
// inert in Apps Script (no `module`) and only exposes pure helpers to Node tests.

const CONFIG = {
  jiraUrl: 'https://your-domain.atlassian.net',
  jiraEmail: 'your-jira-user@company.com',
  jiraToken: 'your_jira_api_token_here',
  jiraProject: 'YOUR_PROJECT_KEY',
  monitoredEmail: 'support@company.com',
  notificationEmails: ['team-member1@company.com', 'team-member2@company.com']
};

const SUMMARY_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 32767;
const PROCESSED_ID_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function truncateSummary(subject, max) {
  const limit = max || SUMMARY_MAX_LENGTH;
  const cleaned = String(subject || '').replace(/\s+/g, ' ').trim();
  if (cleaned === '') {
    return 'No Subject';
  }
  if (cleaned.length <= limit) {
    return cleaned;
  }
  return cleaned.slice(0, limit - 3).trimEnd() + '...';
}

function buildDescription(sender, body, now) {
  const text = String(body || '').trim() || 'No content';
  const description = 'From: ' + sender + '\nDate: ' + now.toLocaleString() + '\n\n' + text;
  if (description.length <= DESCRIPTION_MAX_LENGTH) {
    return description;
  }
  return description.slice(0, DESCRIPTION_MAX_LENGTH - 3) + '...';
}

function buildIssuePayload(subject, body, sender, projectKey, now) {
  return {
    fields: {
      project: { key: projectKey },
      summary: truncateSummary(subject),
      description: buildDescription(sender, body, now),
      issuetype: { name: 'Task' }
    }
  };
}

function parseIssueResult(responseText, baseUrl) {
  const data = JSON.parse(responseText);
  if (!data.key) {
    throw new Error('Jira response missing issue key');
  }
  return {
    key: data.key,
    url: baseUrl + '/browse/' + data.key
  };
}

function isSelfSent(fromHeader, monitoredEmail) {
  if (!monitoredEmail) {
    return false;
  }
  return String(fromHeader || '').toLowerCase().indexOf(String(monitoredEmail).toLowerCase()) !== -1;
}

function parseProcessedIds(raw) {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function pruneProcessedIds(processedIds, nowMs, maxAgeMs) {
  const cutoff = nowMs - (maxAgeMs || PROCESSED_ID_TTL_MS);
  const pruned = {};
  Object.keys(processedIds || {}).forEach(id => {
    if (processedIds[id] >= cutoff) {
      pruned[id] = processedIds[id];
    }
  });
  return pruned;
}

function buildNotificationBody(originalSubject, sender, jiraTask, now) {
  return [
    'A new Jira task has been created from an email request:',
    '',
    'Task: ' + jiraTask.key,
    'Subject: ' + originalSubject,
    'From: ' + sender,
    'Created: ' + now.toLocaleString(),
    '',
    'View task: ' + jiraTask.url,
    '',
    'This is an automated notification from the Email-to-Jira system.'
  ].join('\n');
}

function buildRawEmail(from, to, subject, bodyText) {
  return [
    'From: ' + from,
    'To: ' + to,
    'Subject: ' + subject,
    '',
    bodyText
  ].join('\r\n');
}

function processEmails() {
  console.log('Checking for new emails...');

  try {
    const threads = GmailApp.search('to:' + CONFIG.monitoredEmail + ' is:unread', 0, 50);

    if (threads.length === 0) {
      console.log('No new emails to monitored address');
      return;
    }

    console.log('Found ' + threads.length + ' unread email thread(s)');

    const scriptProps = PropertiesService.getScriptProperties();
    const stored = parseProcessedIds(scriptProps.getProperty('processedThreadIds'));
    const processedThreadIds = pruneProcessedIds(stored, Date.now());

    let processedCount = 0;

    threads.forEach(thread => {
      const threadId = thread.getId();
      const messages = thread.getMessages();

      if (processedThreadIds[threadId]) {
        console.log('Skipping reply thread (already processed): ' + thread.getFirstMessageSubject());
        messages.forEach(msg => { if (msg.isUnread()) msg.markRead(); });
        return;
      }

      handleEmail(messages[0]);
      processedCount++;

      messages.forEach(msg => { if (msg.isUnread()) msg.markRead(); });
      processedThreadIds[threadId] = Date.now();
    });

    scriptProps.setProperty('processedThreadIds', JSON.stringify(processedThreadIds));
    console.log('Processed ' + processedCount + ' new email thread(s)');

  } catch (error) {
    console.error('Error processing emails: ' + error.toString());
  }
}

function handleEmail(message) {
  const subject = message.getSubject() || 'No Subject';
  const body = message.getPlainBody() || 'No content';
  const sender = message.getFrom() || 'Unknown sender';
  const attachments = message.getAttachments();

  if (isSelfSent(sender, CONFIG.monitoredEmail)) {
    console.log('Skipping self-sent notification: ' + subject);
    return;
  }

  console.log('Processing: ' + subject + ' from ' + sender);

  try {
    const jiraTask = createJiraTask(subject, body, sender);
    console.log('Created Jira task: ' + jiraTask.key);

    if (attachments.length > 0) {
      attachFilesToJiraTask(jiraTask.key, attachments);
      console.log('Attached ' + attachments.length + ' file(s) to ' + jiraTask.key);
    }

    sendNotification(subject, sender, jiraTask);
    console.log('Notifications sent to ' + CONFIG.notificationEmails.join(', '));

  } catch (error) {
    console.error('Failed to process email: ' + error.toString());
  }
}

function createJiraTask(subject, body, sender) {
  const payload = buildIssuePayload(subject, body, sender, CONFIG.jiraProject, new Date());
  const auth = Utilities.base64Encode(CONFIG.jiraEmail + ':' + CONFIG.jiraToken);

  const response = UrlFetchApp.fetch(CONFIG.jiraUrl + '/rest/api/2/issue', {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'Authorization': 'Basic ' + auth },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code !== 201) {
    throw new Error('Jira API error: ' + code + ' - ' + response.getContentText());
  }

  return parseIssueResult(response.getContentText(), CONFIG.jiraUrl);
}

function attachFilesToJiraTask(issueKey, attachments) {
  const auth = Utilities.base64Encode(CONFIG.jiraEmail + ':' + CONFIG.jiraToken);

  attachments.forEach(attachment => {
    try {
      const response = UrlFetchApp.fetch(
        CONFIG.jiraUrl + '/rest/api/2/issue/' + issueKey + '/attachments',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + auth,
            'X-Atlassian-Token': 'no-check'
          },
          payload: { file: attachment.copyBlob() },
          muteHttpExceptions: true
        }
      );

      if (response.getResponseCode() !== 200) {
        console.error('Failed to attach ' + attachment.getName() + ': ' + response.getContentText());
      } else {
        console.log('Attached: ' + attachment.getName());
      }
    } catch (err) {
      console.error('Error attaching ' + attachment.getName() + ': ' + err.toString());
    }
  });
}

function sendNotification(originalSubject, sender, jiraTask) {
  const subject = 'New Jira Task: ' + jiraTask.key;
  const bodyText = buildNotificationBody(originalSubject, sender, jiraTask, new Date());

  CONFIG.notificationEmails.forEach(email => {
    try {
      const rawEmail = buildRawEmail(CONFIG.monitoredEmail, email, subject, bodyText);
      try {
        Gmail.Users.Messages.send({ raw: Utilities.base64EncodeWebSafe(rawEmail) }, 'me');
      } catch (apiError) {
        console.error('Gmail API failed for ' + email + ', falling back to GmailApp: ' + apiError.toString());
        GmailApp.sendEmail(email, subject, bodyText);
      }
    } catch (error) {
      console.error('Failed to send notification to ' + email + ': ' + error.toString());
    }
  });
}

function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyMinutes(10)
    .create();

  console.log('Automation trigger set up, will check emails every 10 minutes');
}

function testSetup() {
  console.log('Testing Email-to-Jira automation setup...');

  try {
    const testTask = createJiraTask(
      'Test: Email-to-Jira Setup Verification',
      'This is a test task created during setup. You can delete this task.',
      'automation-test@system'
    );

    console.log('Jira connection successful: ' + testTask.key);
    console.log('Test task URL: ' + testTask.url);

    sendNotification('Test: Email-to-Jira Setup Verification', 'automation-test@system', testTask);
    console.log('Test notifications sent to ' + CONFIG.notificationEmails.join(', '));

    console.log('Setup test completed.');

  } catch (error) {
    console.error('Setup test failed: ' + error.toString());
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    truncateSummary,
    buildDescription,
    buildIssuePayload,
    parseIssueResult,
    isSelfSent,
    parseProcessedIds,
    pruneProcessedIds,
    buildNotificationBody,
    buildRawEmail
  };
}
