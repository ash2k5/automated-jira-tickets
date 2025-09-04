import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import { storage } from '../storage';
import { jiraService } from './jiraService';
import { notificationService } from './notificationService';

export class EmailProcessor {
  private imap: Imap;
  private isConnected = false;

  constructor() {
    this.imap = new Imap({
      user: process.env.EMAIL_USER || 'itrequests@nrinstitute.org',
      password: process.env.EMAIL_PASSWORD || '',
      host: process.env.EMAIL_HOST || 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    this.imap.once('ready', () => {
      console.log('IMAP connection ready');
      this.isConnected = true;
    });

    this.imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      console.log('IMAP connection ended');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.imap.once('ready', () => {
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.imap.end();
      this.isConnected = false;
    }
  }

  async processEmails(): Promise<void> {
    try {
      console.log('Starting email processing...');
      await this.connect();

      await new Promise<void>((resolve, reject) => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for unread emails
          this.imap.search(['UNSEEN'], async (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              console.log('No new emails to process');
              resolve();
              return;
            }

            console.log(`Found ${results.length} new emails`);

            const fetch = this.imap.fetch(results, { 
              bodies: '',
              markSeen: false
            });

            const processedEmails: string[] = [];

            fetch.on('message', (msg, seqno) => {
              msg.on('body', async (stream, info) => {
                try {
                  const email = await simpleParser(stream);
                  const messageId = email.messageId || `email-${Date.now()}-${seqno}`;

                  // Check if already processed
                  const existing = await storage.getEmailLog(messageId);
                  if (existing) {
                    console.log(`Email ${messageId} already processed, skipping`);
                    return;
                  }

                  await this.processEmail(email, messageId);
                  processedEmails.push(messageId);

                } catch (error) {
                  console.error('Error processing email:', error);
                }
              });
            });

            fetch.once('error', reject);
            fetch.once('end', () => {
              // Mark processed emails as read
              if (processedEmails.length > 0) {
                this.imap.addFlags(results, '\\Seen', (err) => {
                  if (err) console.error('Error marking emails as read:', err);
                });
              }
              resolve();
            });
          });
        });
      });

      await this.updateSystemStats();

    } catch (error) {
      console.error('Email processing error:', error);
      throw error;
    }
  }

  private async processEmail(email: any, messageId: string): Promise<void> {
    try {
      const subject = email.subject || 'No Subject';
      const body = email.text || email.html || 'No content';
      const from = email.from?.text || 'Unknown sender';

      console.log(`Processing email: ${subject} from ${from}`);

      // Log the email
      const emailLog = await storage.createEmailLog({
        messageId,
        from,
        subject,
        body,
        status: 'pending',
        jiraTaskKey: null,
        errorMessage: null,
      });

      try {
        // Create Jira task
        const jiraTask = await jiraService.createTask(subject, body, from);
        
        // Update log with success
        await storage.updateEmailLog(messageId, {
          status: 'success',
          jiraTaskKey: jiraTask.key,
        });

        // Send notification
        await notificationService.sendTaskCreatedNotification(
          subject,
          from,
          jiraTask
        );

        console.log(`Successfully created Jira task ${jiraTask.key} for email ${messageId}`);

      } catch (error) {
        // Update log with failure
        await storage.updateEmailLog(messageId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        console.error(`Failed to process email ${messageId}:`, error);
      }

    } catch (error) {
      console.error('Error in processEmail:', error);
      throw error;
    }
  }

  private async updateSystemStats(): Promise<void> {
    try {
      const logs = await storage.getAllEmailLogs();
      const totalEmails = logs.length;
      const successfulTasks = logs.filter(log => log.status === 'success').length;
      const successRate = totalEmails > 0 ? Math.round((successfulTasks / totalEmails) * 100) : 0;

      await storage.updateSystemStats({
        emailsProcessed: totalEmails,
        tasksCreated: successfulTasks,
        successRate,
      });

      await storage.updateSystemConfig({
        lastRunAt: new Date(),
      });

    } catch (error) {
      console.error('Error updating system stats:', error);
    }
  }

  async testEmailProcessing(subject: string, body: string): Promise<any> {
    try {
      console.log('Running test email processing...');
      
      const testEmail = {
        messageId: `test-${Date.now()}`,
        subject,
        text: body,
        from: { text: 'test@example.com' }
      };

      await this.processEmail(testEmail, testEmail.messageId);
      
      // Return the created log for testing
      return await storage.getEmailLog(testEmail.messageId);
      
    } catch (error) {
      console.error('Test email processing failed:', error);
      throw error;
    }
  }
}

export const emailProcessor = new EmailProcessor();
