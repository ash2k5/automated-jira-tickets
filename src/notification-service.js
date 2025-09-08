/**
 * Email notification service
 */

export class NotificationService {
  constructor(config) {
    this.config = config;
  }

  async sendNotification(originalSubject, sender, jiraTask) {
    const subject = `New Jira Task: ${jiraTask.key}`;
    const body = `A new Jira task has been created from an email request:

Task: ${jiraTask.key}
Subject: ${originalSubject}
From: ${sender}
Created: ${new Date().toLocaleString()}

View task: ${jiraTask.url}

This is an automated notification.`;
    
    if (typeof GmailApp !== 'undefined') {
      // Running in Google Apps Script
      GmailApp.sendEmail(this.config.notificationEmail, subject, body);
      console.log(`Email sent to ${this.config.notificationEmail}`);
    } else {
      // Running in Node.js for testing
      console.log(`[TEST MODE] Email would be sent to: ${this.config.notificationEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
    }
    
    return Promise.resolve();
  }
}