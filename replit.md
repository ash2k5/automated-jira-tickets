# Overview

This is an email-to-Jira automation system that processes incoming emails and creates Jira tasks automatically. The system features a React-based dashboard for monitoring and configuration, an Express.js backend for email processing and API handling, and integrations with IMAP email servers and Jira REST API. Users can configure system settings, monitor processing logs, test connections, and view system statistics through an intuitive web interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application uses a modern React stack with TypeScript, built around a single-page application (SPA) architecture. The UI is built with shadcn/ui components providing a consistent design system, with Tailwind CSS for styling and Wouter for lightweight client-side routing. The frontend uses TanStack Query for server state management and form handling through React Hook Form with Zod validation. The application follows a component-based architecture with reusable UI components, custom hooks for mobile responsiveness, and a centralized query client for API communication.

## Backend Architecture  
The server implements a RESTful API using Express.js with TypeScript, following a modular service-oriented architecture. The main components include:
- **Storage Layer**: An abstraction layer with in-memory storage implementation for user data, email logs, system configuration, and statistics
- **Email Processing Service**: Handles IMAP connections to email servers, parses incoming emails, and processes them asynchronously  
- **Jira Integration Service**: Manages Jira API communication for creating tasks and handling authentication
- **Notification Service**: Sends email notifications using SMTP when tasks are created or errors occur
- **Cron Scheduling**: Automated email processing on configurable intervals

## Data Storage
The application uses a hybrid storage approach with Drizzle ORM configured for PostgreSQL production deployments, while implementing an in-memory storage system for development and testing. The schema defines tables for users, email logs, system configuration, and statistics. Database migrations are managed through Drizzle Kit, and the system supports both development and production database environments.

## Authentication & Security
The system implements basic authentication mechanisms and uses environment variables for sensitive configuration like API keys and database credentials. CORS is configured for cross-origin requests, and the API includes error handling middleware for proper error responses.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database service for production data storage
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support

## Email Services  
- **IMAP Integration**: Connects to email servers (Gmail, corporate email) for reading incoming messages
- **SMTP Integration**: Sends outbound notifications through email service providers
- **Mailparser**: Parses email content and attachments from IMAP messages

## Third-Party APIs
- **Jira REST API**: Creates and manages Jira tasks programmatically using Basic authentication
- **Axios HTTP Client**: Handles API requests to external services with proper error handling

## UI Framework & Styling
- **Radix UI**: Headless component library providing accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind
- **Lucide React**: Icon library for consistent iconography

## Development & Build Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: JavaScript bundler for production builds
- **Replit Integration**: Development environment plugins and runtime error handling