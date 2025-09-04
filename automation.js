#!/usr/bin/env node

/**
 * Email to Jira Automation Script
 * 
 * This script automatically processes emails from a specified inbox
 * and creates Jira tasks based on email content.
 * 
 * Features:
 * - Monitors email inbox via IMAP
 * - Creates Jira tasks with email subject as title and body as description
 * - Sends notification emails when tasks are created
 * - Runs on configurable schedule (default: every 10 minutes)
 * - Logs all processing activities
 */

import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import axios from 'axios';
import cron from 'node-cron';

// Configuration from environment variables
const CONFIG = {
  // Email settings
  EMAIL_USER: process.env.EMAIL_USER || 'itrequests@nrinstitute.org',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_HOST: process.env.EMAIL_HOST || 'imap.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 993,
  
  // SMTP settings for notifications
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
  
  // Jira settings
  JIRA_URL: process.env.JIRA_URL,
  JIRA_EMAIL: process.env.JIRA_EMAIL,
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
  JIRA_PROJECT_KEY: process.env.JIRA_PROJECT_KEY || 'IT',
  JIRA_ISSUE_TYPE: process.env.JIRA_ISSUE_TYPE || 'Task',
  
  // Notification settings
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL || 'bwilson@nationalreview.com',
  
  // Schedule settings
  CHECK_INTERVAL: process.env.CHECK_INTERVAL || 10, // minutes
  RUN_ONCE: process.env.RUN_ONCE === 'true',
};

// Validation
function validateConfig() {
  const required = [
    'EMAIL_PASSWORD',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'JIRA_URL',
    'JIRA_EMAIL',
    'JIRA_API_TOKEN'
  ];
  
  const missing = required.filter(key => !CONFIG[key]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

// In-memory tracking of processed emails
const processedEmails = new Set();

// Email processor class
class EmailToJiraProcessor {
  constructor() {
    this.imap = new Imap({
      user: CONFIG.EMAIL_USER,
      password: CONFIG.EMAIL_PASSWORD,
      host: CONFIG.EMAIL_HOST,
      port: CONFIG.EMAIL_PORT,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    this.transporter = nodemailer.createTransport({
      host: CONFIG.SMTP_HOST,
      port: parseInt(CONFIG.SMTP_PORT),
      secure: CONFIG.SMTP_PORT == 465,
      auth: {
        user: CONFIG.SMTP_USER,
        pass: CONFIG.SMTP_PASSWORD,
      },
    });

    this.setupImapHandlers();
  }

  setupImapHandlers() {
    this.imap.once('ready', () => {
      console.log('📧 IMAP connection established');
    });

    this.imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err);
    });

    this.imap.once('end', () => {
      console.log('📧 IMAP connection ended');
    });
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', resolve);
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async disconnect() {
    return new Promise((resolve) => {
      this.imap.once('end', resolve);
      this.imap.end();
    });
  }

  async processEmails() {
    console.log('🔄 Starting email processing...');
    
    try {
      await this.connect();
      
      await new Promise((resolve, reject) => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) return reject(err);

          // Search for unread emails
          this.imap.search(['UNSEEN'], async (err, results) => {
            if (err) return reject(err);

            if (!results || results.length === 0) {
              console.log('📭 No new emails to process');
              return resolve();
            }

            console.log(`📬 Found ${results.length} new emails`);

            const fetch = this.imap.fetch(results, { 
              bodies: '',
              markSeen: false
            });

            let processedCount = 0;

            fetch.on('message', (msg, seqno) => {
              msg.on('body', async (stream, info) => {
                try {
                  const email = await simpleParser(stream);
                  const messageId = email.messageId || `email-${Date.now()}-${seqno}`;

                  if (processedEmails.has(messageId)) {
                    console.log(`⏭️  Email ${messageId} already processed, skipping`);
                    return;
                  }

                  await this.processSingleEmail(email, messageId);
                  processedEmails.add(messageId);
                  processedCount++;

                } catch (error) {
                  console.error('❌ Error processing email:', error.message);
                }
              });
            });

            fetch.once('error', reject);
            fetch.once('end', () => {
              if (processedCount > 0) {
                // Mark processed emails as read
                this.imap.addFlags(results, '\\Seen', (err) => {
                  if (err) console.error('❌ Error marking emails as read:', err);
                });
              }
              console.log(`✅ Processed ${processedCount} emails`);
              resolve();
            });
          });
        });
      });

    } catch (error) {
      console.error('❌ Email processing failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async processSingleEmail(email, messageId) {
    const subject = email.subject || 'No Subject';
    const body = email.text || email.html || 'No content';
    const from = email.from?.text || 'Unknown sender';

    console.log(`📧 Processing: "${subject}" from ${from}`);

    try {
      // Create Jira task
      const jiraTask = await this.createJiraTask(subject, body, from);
      console.log(`✅ Created Jira task: ${jiraTask.key}`);

      // Send notification
      await this.sendNotification(subject, from, jiraTask);
      console.log(`📬 Notification sent to ${CONFIG.NOTIFICATION_EMAIL}`);

    } catch (error) {
      console.error(`❌ Failed to process email "${subject}":`, error.message);
      throw error;
    }
  }

  async createJiraTask(subject, body, fromEmail) {
    const issueData = {
      fields: {
        project: {
          key: CONFIG.JIRA_PROJECT_KEY
        },
        summary: subject,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `From: ${fromEmail}`,
                  marks: [{ type: 'strong' }]
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Date: ${new Date().toISOString()}`,
                  marks: [{ type: 'strong' }]
                }
              ]
            },
            {
              type: 'rule'
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Email Content:'
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: body || 'No content'
                }
              ]
            }
          ]
        },
        issuetype: {
          name: CONFIG.JIRA_ISSUE_TYPE
        }
      }
    };

    const authHeader = Buffer.from(`${CONFIG.JIRA_EMAIL}:${CONFIG.JIRA_API_TOKEN}`).toString('base64');

    const response = await axios.post(
      `${CONFIG.JIRA_URL}/rest/api/3/issue`,
      issueData,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      id: response.data.id,
      key: response.data.key,
      url: `${CONFIG.JIRA_URL}/browse/${response.data.key}`
    };
  }

  async sendNotification(originalSubject, fromEmail, jiraTask) {
    const subject = `New Jira Task Created: ${jiraTask.key}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0052CC; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 24px;">New Jira Task Created</h2>
        </div>
        
        <div style="background-color: #f4f5f7; padding: 20px; border: 1px solid #ddd; border-top: none;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0052CC; margin-top: 0;">Task Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Task ID:</td>
                <td style="padding: 8px 0; color: #666;">${jiraTask.key}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Original Subject:</td>
                <td style="padding: 8px 0; color: #666;">${originalSubject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">From:</td>
                <td style="padding: 8px 0; color: #666;">${fromEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Created:</td>
                <td style="padding: 8px 0; color: #666;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${jiraTask.url}" 
               style="background-color: #0052CC; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold; font-size: 16px;">
              View Task in Jira
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border: 1px solid #ddd; 
                    border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            This is an automated notification from the Email to Jira Automation System.
          </p>
        </div>
      </div>
    `;

    const plainBody = `
New Jira Task Created

Task ID: ${jiraTask.key}
Original Subject: ${originalSubject}
From: ${fromEmail}
Created: ${new Date().toLocaleString()}

View Task: ${jiraTask.url}

This is an automated notification from the Email to Jira Automation System.
    `;

    await this.transporter.sendMail({
      from: CONFIG.SMTP_FROM || CONFIG.SMTP_USER,
      to: CONFIG.NOTIFICATION_EMAIL,
      subject,
      text: plainBody,
      html: htmlBody,
    });
  }
}

// Main execution function
async function main() {
  console.log('🚀 Email to Jira Automation Starting...');
  
  // Validate configuration
  validateConfig();
  
  const processor = new EmailToJiraProcessor();
  
  if (CONFIG.RUN_ONCE) {
    // Run once and exit
    console.log('🔄 Running in single execution mode');
    try {
      await processor.processEmails();
      console.log('✅ Single execution completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Single execution failed:', error.message);
      process.exit(1);
    }
  } else {
    // Schedule recurring execution
    const cronExpression = `*/${CONFIG.CHECK_INTERVAL} * * * *`;
    console.log(`⏰ Scheduling email processing every ${CONFIG.CHECK_INTERVAL} minutes`);
    
    cron.schedule(cronExpression, async () => {
      try {
        await processor.processEmails();
      } catch (error) {
        console.error('❌ Scheduled processing failed:', error.message);
      }
    });
    
    // Run initial processing
    try {
      await processor.processEmails();
    } catch (error) {
      console.error('❌ Initial processing failed:', error.message);
    }
    
    console.log('✅ Automation is running. Press Ctrl+C to stop.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { EmailToJiraProcessor, CONFIG };