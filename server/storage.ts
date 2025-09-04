import { 
  type User, 
  type InsertUser, 
  type EmailLog, 
  type InsertEmailLog,
  type SystemConfig,
  type InsertSystemConfig,
  type SystemStats,
  type InsertSystemStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Email log methods
  getEmailLog(messageId: string): Promise<EmailLog | undefined>;
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  updateEmailLog(messageId: string, updates: Partial<EmailLog>): Promise<EmailLog | undefined>;
  getRecentEmailLogs(limit?: number): Promise<EmailLog[]>;
  getAllEmailLogs(): Promise<EmailLog[]>;

  // System config methods
  getSystemConfig(): Promise<SystemConfig | undefined>;
  createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig | undefined>;

  // System stats methods
  getSystemStats(): Promise<SystemStats | undefined>;
  createSystemStats(stats: InsertSystemStats): Promise<SystemStats>;
  updateSystemStats(updates: Partial<SystemStats>): Promise<SystemStats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emailLogs: Map<string, EmailLog>;
  private systemConfig: SystemConfig | undefined;
  private systemStats: SystemStats | undefined;

  constructor() {
    this.users = new Map();
    this.emailLogs = new Map();
    
    // Initialize default system config
    this.systemConfig = {
      id: randomUUID(),
      jiraUrl: process.env.JIRA_URL || "",
      jiraEmail: process.env.JIRA_EMAIL || "",
      jiraProjectKey: process.env.JIRA_PROJECT_KEY || "IT",
      jiraIssueType: "Task",
      notificationEmail: process.env.NOTIFICATION_EMAIL || "bwilson@nationalreview.com",
      emailCheckInterval: 10,
      isRunning: false,
      lastRunAt: null,
    };

    // Initialize default system stats
    this.systemStats = {
      id: randomUUID(),
      emailsProcessed: 0,
      tasksCreated: 0,
      successRate: 0,
      lastUpdated: new Date(),
    };
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Email log methods
  async getEmailLog(messageId: string): Promise<EmailLog | undefined> {
    return this.emailLogs.get(messageId);
  }

  async createEmailLog(insertLog: InsertEmailLog): Promise<EmailLog> {
    const id = randomUUID();
    const log: EmailLog = { 
      ...insertLog, 
      id,
      processedAt: new Date(),
      jiraTaskKey: insertLog.jiraTaskKey || null,
      errorMessage: insertLog.errorMessage || null
    };
    this.emailLogs.set(insertLog.messageId, log);
    return log;
  }

  async updateEmailLog(messageId: string, updates: Partial<EmailLog>): Promise<EmailLog | undefined> {
    const existing = this.emailLogs.get(messageId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.emailLogs.set(messageId, updated);
    return updated;
  }

  async getRecentEmailLogs(limit: number = 50): Promise<EmailLog[]> {
    const logs = Array.from(this.emailLogs.values())
      .sort((a, b) => new Date(b.processedAt!).getTime() - new Date(a.processedAt!).getTime())
      .slice(0, limit);
    return logs;
  }

  async getAllEmailLogs(): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values());
  }

  // System config methods
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    return this.systemConfig;
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const id = randomUUID();
    this.systemConfig = { 
      ...config, 
      id,
      jiraIssueType: config.jiraIssueType || "Task",
      emailCheckInterval: config.emailCheckInterval || 10,
      isRunning: config.isRunning || false,
      lastRunAt: null
    };
    return this.systemConfig;
  }

  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig | undefined> {
    if (!this.systemConfig) return undefined;
    
    this.systemConfig = { ...this.systemConfig, ...updates };
    return this.systemConfig;
  }

  // System stats methods
  async getSystemStats(): Promise<SystemStats | undefined> {
    return this.systemStats;
  }

  async createSystemStats(stats: InsertSystemStats): Promise<SystemStats> {
    const id = randomUUID();
    this.systemStats = { 
      ...stats, 
      id, 
      emailsProcessed: stats.emailsProcessed || 0,
      tasksCreated: stats.tasksCreated || 0,
      successRate: stats.successRate || 0,
      lastUpdated: new Date() 
    };
    return this.systemStats;
  }

  async updateSystemStats(updates: Partial<SystemStats>): Promise<SystemStats | undefined> {
    if (!this.systemStats) return undefined;
    
    this.systemStats = { 
      ...this.systemStats, 
      ...updates, 
      lastUpdated: new Date() 
    };
    return this.systemStats;
  }
}

export const storage = new MemStorage();
