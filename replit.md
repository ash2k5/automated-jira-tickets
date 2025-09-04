# Overview

This is a streamlined email-to-Jira automation script that processes incoming emails and creates Jira tasks automatically. The system is designed as a standalone Node.js application that runs continuously in the background, monitoring an email inbox and creating corresponding Jira tasks without requiring a web interface.

# User Preferences

Preferred communication style: Simple, everyday language.
Preferred deployment: Background automation script without dashboard interface.

# System Architecture

## Core Application
The application is built as a single Node.js script (`automation.js`) that handles all functionality:
- **Email Processing**: Monitors IMAP email server for new messages
- **Jira Integration**: Creates tasks via Jira REST API with email content
- **Notification System**: Sends email notifications when tasks are created
- **Scheduled Execution**: Runs on configurable intervals using cron scheduling
- **Error Handling**: Comprehensive logging and error management

## Key Features
- Automated email monitoring every 10 minutes (configurable)
- Email subject becomes Jira task title
- Email body becomes Jira task description  
- Task is not assigned to anyone (as requested)
- Notification email sent to designated address with task link
- Processed emails are marked as read to avoid duplicates

# External Dependencies

## Core Dependencies
- **Node.js**: Runtime environment for the automation script
- **node-imap**: IMAP client for connecting to email servers
- **mailparser**: Email content parsing and processing
- **nodemailer**: SMTP client for sending notification emails
- **axios**: HTTP client for Jira REST API communication
- **node-cron**: Task scheduling for automated email processing

## Email Services  
- **IMAP Integration**: Connects to email servers (Gmail, corporate email) for reading incoming messages
- **SMTP Integration**: Sends outbound notifications through email service providers

## Third-Party APIs
- **Jira REST API**: Creates and manages Jira tasks programmatically using Basic authentication

## Deployment Options
- **Docker**: Containerized deployment with health checks
- **PM2**: Process manager for production Node.js applications
- **Systemd**: Linux service for automatic startup and monitoring