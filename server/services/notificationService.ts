import * as nodemailer from 'nodemailer';
import { storage } from '../storage';
import type { JiraTask } from './jiraService';

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendTaskCreatedNotification(
    originalSubject: string,
    fromEmail: string,
    jiraTask: JiraTask
  ): Promise<void> {
    try {
      const config = await storage.getSystemConfig();
      if (!config) {
        throw new Error('System configuration not found');
      }

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
              This is an automated notification from the IT Request Email Processing System.
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

This is an automated notification from the IT Request Email Processing System.
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: config.notificationEmail,
        subject,
        text: plainBody,
        html: htmlBody,
      });

      console.log(`Notification sent to ${config.notificationEmail} for task ${jiraTask.key}`);

    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  }

  async testEmail(toEmail: string): Promise<void> {
    try {
      const subject = 'Test Email from Jira Automation System';
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0052CC; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Test Email</h2>
          </div>
          <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>This is a test email from the Jira Email Automation System.</p>
            <p>If you received this email, the notification system is working correctly.</p>
            <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html: htmlBody,
      });

      console.log(`Test email sent to ${toEmail}`);

    } catch (error) {
      console.error('Failed to send test email:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
