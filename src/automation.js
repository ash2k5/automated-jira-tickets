const CONFIG = {
  jiraUrl: 'https://your-domain.atlassian.net',
  jiraEmail: 'your-jira-user@company.com',
  jiraToken: 'your_jira_api_token_here',
  jiraProject: 'YOUR_PROJECT_KEY',
  monitoredEmail: 'support@company.com',
  notificationEmails: ['team-member1@company.com', 'team-member2@company.com']
};

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
    const processedThreadIds = JSON.parse(scriptProps.getProperty('processedThreadIds') || '{}');

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    Object.keys(processedThreadIds).forEach(id => {
      if (processedThreadIds[id] < thirtyDaysAgo) {
        delete processedThreadIds[id];
      }
    });

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

  if (sender.indexOf(CONFIG.monitoredEmail) !== -1) {
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
  const taskData = {
    fields: {
      project: { key: CONFIG.jiraProject },
      summary: subject,
      description: 'From: ' + sender + '\nDate: ' + new Date().toLocaleString() + '\n\n' + body,
      issuetype: { name: 'Task' }
    }
  };

  const auth = Utilities.base64Encode(CONFIG.jiraEmail + ':' + CONFIG.jiraToken);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(taskData)
  };

  const response = UrlFetchApp.fetch(CONFIG.jiraUrl + '/rest/api/2/issue', options);

  if (response.getResponseCode() !== 201) {
    throw new Error('Jira API error: ' + response.getResponseCode() + ' - ' + response.getContentText());
  }

  const responseData = JSON.parse(response.getContentText());

  return {
    key: responseData.key,
    url: CONFIG.jiraUrl + '/browse/' + responseData.key
  };
}

function attachFilesToJiraTask(issueKey, attachments) {
  const auth = Utilities.base64Encode(CONFIG.jiraEmail + ':' + CONFIG.jiraToken);

  attachments.forEach(attachment => {
    try {
      const options = {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + auth,
          'X-Atlassian-Token': 'no-check'
        },
        payload: { file: attachment.copyBlob() }
      };

      const response = UrlFetchApp.fetch(
        CONFIG.jiraUrl + '/rest/api/2/issue/' + issueKey + '/attachments',
        options
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
  const bodyText = 'A new Jira task has been created from an email request:\n\n' +
                   'Task: ' + jiraTask.key + '\n' +
                   'Subject: ' + originalSubject + '\n' +
                   'From: ' + sender + '\n' +
                   'Created: ' + new Date().toLocaleString() + '\n\n' +
                   'View task: ' + jiraTask.url + '\n\n' +
                   'This is an automated notification from the Email-to-Jira system.';

  CONFIG.notificationEmails.forEach(email => {
    try {
      const rawEmail = [
        'From: ' + CONFIG.monitoredEmail,
        'To: ' + email,
        'Subject: ' + subject,
        '',
        bodyText
      ].join('\r\n');

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
    const fn = trigger.getHandlerFunction();
    if (fn === 'processEmails' || fn === 'checkForNewEmails') {
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
