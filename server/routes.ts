import type { Express } from "express";
import { createServer, type Server } from "http";
import cron from 'node-cron';
import { storage } from "./storage";
import { emailProcessor } from "./services/emailProcessor";
import { jiraService } from "./services/jiraService";
import { notificationService } from "./services/notificationService";
import { insertSystemConfigSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // System status and stats
  app.get("/api/system/status", async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      const stats = await storage.getSystemStats();
      
      res.json({
        config,
        stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get system configuration
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Update system configuration
  app.put("/api/config", async (req, res) => {
    try {
      const validatedData = insertSystemConfigSchema.parse(req.body);
      const updated = await storage.updateSystemConfig(validatedData);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid configuration data" 
      });
    }
  });

  // Get email logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getRecentEmailLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Manual email processing
  app.post("/api/process-emails", async (req, res) => {
    try {
      await emailProcessor.processEmails();
      const stats = await storage.getSystemStats();
      res.json({ 
        message: "Email processing completed",
        stats 
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Email processing failed" 
      });
    }
  });

  // Test Jira connection
  app.post("/api/test/jira", async (req, res) => {
    try {
      const result = await jiraService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Connection test failed" 
      });
    }
  });

  // Test email notification
  app.post("/api/test/email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      await notificationService.testEmail(email);
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Test email failed" 
      });
    }
  });

  // Test email processing with sample data
  app.post("/api/test/process", async (req, res) => {
    try {
      const { subject, body } = req.body;
      if (!subject || !body) {
        return res.status(400).json({ message: "Subject and body are required" });
      }
      
      const result = await emailProcessor.testEmailProcessing(subject, body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Test processing failed" 
      });
    }
  });

  // Start/stop automation
  app.post("/api/automation/:action", async (req, res) => {
    try {
      const { action } = req.params;
      
      if (action === 'start') {
        await storage.updateSystemConfig({ isRunning: true });
        res.json({ message: "Automation started" });
      } else if (action === 'stop') {
        await storage.updateSystemConfig({ isRunning: false });
        res.json({ message: "Automation stopped" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Action failed" 
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Setup cron job for email processing
  const setupCronJob = async () => {
    const config = await storage.getSystemConfig();
    if (config && config.isRunning) {
      // Run every 10 minutes (or as configured)
      cron.schedule(`*/${config.emailCheckInterval} * * * *`, async () => {
        try {
          console.log('Running scheduled email processing...');
          await emailProcessor.processEmails();
        } catch (error) {
          console.error('Scheduled email processing failed:', error);
        }
      });
      
      console.log(`Email processing scheduled every ${config.emailCheckInterval} minutes`);
    }
  };

  // Initialize cron job
  setupCronJob();

  const httpServer = createServer(app);
  return httpServer;
}
