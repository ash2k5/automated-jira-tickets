/**
 * Email to Jira Automation
 * 
 * Automatically creates Jira tasks from emails sent to itrequests@nrinstitute.org
 * and sends notifications to the designated team member.
 * 
 * For Google Workspace Admin deployment.
 */

const CONFIG = {
  jiraUrl: 'https://nationalreview.atlassian.net',
  jiraEmail: 'asantosh@nrinstitute.org',
  jiraToken: 'ATATT3xFfGF0mYAyp4s6Pl4dMxpPX4WxSiNGLpVDl-tOaBfzOrMJzIXbrXsIGtrEsI7yA-tSO_ARp9iOIHvsOlSN8vfuKg_wISknXiHWYMctq4IesqjzjYzQb-HEaxqsiiivLxQhG0CrtxL1ZtUSNXE27T2zey0MFxWzQq2XkuiwPXSGgNjdGR8=4058B09B',
  jiraProject: 'NRTT',
  notificationEmails: ['bwilson@nationalreview.com', 'rjenkins@nationalreview.com']
};

/**
 * Main function to process emails and create Jira tasks
 * Triggered automatically every 10 minutes
 */
function checkForNewEmails() {
  console.log('Checking for new emails...');
  
  try {
    const threads = GmailApp.search('to:itrequests@nrinstitute.org is:unread', 0, 50);
    
    if (threads.length === 0) {
      console.log('No new emails to itrequests@nrinstitute.org');
      return;
    }
    
    console.log('Found ' + threads.length + ' unread email thread(s)');
    
    // Only process emails from the last 15 minutes (buffer for processing)
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
    let processedCount = 0;
    
    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(message => {
        if (message.isUnread()) {
          const emailDate = message.getDate();
          
          if (emailDate >= cutoffTime) {
            handleEmail(message);
            processedCount++;
          } else {
            console.log('Skipping old email: ' + message.getSubject() + ' from ' + emailDate);
          }
          
          message.markRead();
        }
      });
    });
    
    console.log('Processed ' + processedCount + ' recent emails');
    
  } catch (error) {
    console.error('Error processing emails: ' + error.toString());
  }
}

/**
 * Handle a single email message
 */
function handleEmail(message) {
  const subject = message.getSubject() || 'No Subject';
  const body = message.getPlainBody() || 'No content';
  const sender = message.getFrom() || 'Unknown sender';
  
  console.log('Processing: ' + subject + ' from ' + sender);
  
  try {
    const jiraTask = createJiraTask(subject, body, sender);
    console.log('Created Jira task: ' + jiraTask.key);
    
    sendNotification(subject, sender, jiraTask);
    console.log('Notifications sent to ' + CONFIG.notificationEmails.join(', '));
    
  } catch (error) {
    console.error('Failed to process email: ' + error.toString());
  }
}

/**
 * Create a Jira task using the REST API
 */
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

/**
 * Send notification email to designated team member
 */
function sendNotification(originalSubject, sender, jiraTask) {
  const subject = 'New Jira Task: ' + jiraTask.key;
  const bodyText = 'A new Jira task has been created from an email request:\n\n' +
                   'Task: ' + jiraTask.key + '\n' +
                   'Subject: ' + originalSubject + '\n' +
                   'From: ' + sender + '\n' +
                   'Created: ' + new Date().toLocaleString() + '\n\n' +
                   'View task: ' + jiraTask.url + '\n\n' +
                   'This is an automated notification from the Email-to-Jira system.';

  // Send to each notification email
  CONFIG.notificationEmails.forEach(email => {
    try {
      // Create raw email message for Gmail API
      const rawEmail = [
        'From: itrequests@nrinstitute.org',
        'To: ' + email,
        'Subject: ' + subject,
        '',
        bodyText
      ].join('\r\n');

      const base64EncodedEmail = Utilities.base64EncodeWebSafe(rawEmail);

      try {
        Gmail.Users.Messages.send({
          'raw': base64EncodedEmail
        }, 'me');
      } catch (apiError) {
        console.error('Failed to send notification via Gmail API to ' + email + ', falling back to GmailApp: ' + apiError.toString());
        GmailApp.sendEmail(email, subject, bodyText);
      }
    } catch (error) {
      console.error('Failed to send notification to ' + email + ': ' + error.toString());
    }
  });
}

/**
 * Set up automated trigger to run every 10 minutes
 * Run this function once after deployment to activate automation
 */
function setupTrigger() {
  // Delete existing triggers first to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkForNewEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger to run every 10 minutes
  ScriptApp.newTrigger('checkForNewEmails')
    .timeBased()
    .everyMinutes(10)
    .create();
    
  console.log('Automation trigger set up - will check emails every 10 minutes');
}

/**
 * Test function for initial setup verification
 * Run this once to test the system before activating automation
 */
function testSetup() {
  console.log('Testing Email-to-Jira automation setup...');
  
  try {
    // Test Jira connection by creating a test task
    const testTask = createJiraTask(
      'Test: Email-to-Jira Setup Verification', 
      'This is a test task created during setup. You can delete this task.', 
      'automation-test@system'
    );
    
    console.log('Jira connection successful: ' + testTask.key);
    console.log('Test task URL: ' + testTask.url);
    
    // Test notification
    sendNotification('Test: Email-to-Jira Setup Verification', 'automation-test@system', testTask);
    console.log('Test notifications sent to ' + CONFIG.notificationEmails.join(', '));
    
    console.log('Setup test completed successfully! Ready for production.');
    
  } catch (error) {
    console.error('Setup test failed: ' + error.toString());
  }
}