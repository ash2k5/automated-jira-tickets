#!/usr/bin/env node

/**
 * Email to Jira Automation - Node.js Version
 * Main application entry point for local testing
 */

import { config, validateConfig } from './config/config.js';
import { EmailProcessor } from './src/email-processor.js';
import { JiraClient } from './src/jira-client.js';
import { NotificationService } from './src/notification-service.js';

class EmailToJiraAutomation {
  constructor() {
    this.emailProcessor = new EmailProcessor(config);
    this.jiraClient = new JiraClient(config);
    this.notificationService = new NotificationService(config);
  }

  async processEmails() {
    try {
      const emails = await this.emailProcessor.processEmails();
      
      for (const email of emails) {
        await this.handleEmail(email);
      }
    } catch (error) {
      console.error('Error processing emails:', error.message);
    }
  }

  async handleEmail(email) {
    console.log(`Processing: "${email.subject}" from ${email.sender}`);
    
    try {
      const jiraTask = await this.jiraClient.createTask(
        email.subject, 
        email.body, 
        email.sender
      );
      console.log(`Created Jira task: ${jiraTask.key}`);
      
      await this.notificationService.sendNotification(
        email.subject, 
        email.sender, 
        jiraTask
      );
      console.log(`Notification sent`);
      
    } catch (error) {
      console.error(`Failed to process "${email.subject}":`, error.message);
    }
  }

  start() {
    console.log('Starting Email to Jira Automation');
    
    this.processEmails();
    
    setInterval(() => {
      this.processEmails();
    }, config.checkIntervalMinutes * 60 * 1000);
    
    console.log(`Automation running. Checking emails every ${config.checkIntervalMinutes} minutes. Press Ctrl+C to stop.`);
  }
}

async function main() {
  validateConfig();
  
  const automation = new EmailToJiraAutomation();
  automation.start();
}

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

main().catch(console.error);