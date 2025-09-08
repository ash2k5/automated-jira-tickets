/**
 * Application configuration
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Email settings
  emailUser: process.env.EMAIL_USER || 'itrequests@nrinstitute.org',
  emailPassword: process.env.EMAIL_PASSWORD,
  
  // Jira settings  
  jiraUrl: process.env.JIRA_URL || 'https://nationalreview.atlassian.net',
  jiraEmail: process.env.JIRA_EMAIL || 'asantosh@nrinstitute.org',
  jiraToken: process.env.JIRA_API_TOKEN,
  jiraProject: process.env.JIRA_PROJECT || 'NRTT',
  
  // Notification settings
  notificationEmail: 'bwilson@nationalreview.com',
  
  // Scheduling
  checkIntervalMinutes: 10
};

export function validateConfig() {
  const required = ['emailPassword', 'jiraToken'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.log('\nCreate a .env file with:');
    console.log('EMAIL_PASSWORD=your_email_app_password');
    console.log('JIRA_API_TOKEN=your_jira_api_token');
    console.log('\nFor Google Apps Script deployment, no SMTP password needed.');
    process.exit(1);
  }
}