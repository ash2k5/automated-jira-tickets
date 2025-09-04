import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: text("message_id").notNull().unique(),
  from: text("from_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
  jiraTaskKey: text("jira_task_key"),
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
});

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jiraUrl: text("jira_url").notNull(),
  jiraEmail: text("jira_email").notNull(),
  jiraProjectKey: text("jira_project_key").notNull(),
  jiraIssueType: text("jira_issue_type").notNull().default("Task"),
  notificationEmail: text("notification_email").notNull(),
  emailCheckInterval: integer("email_check_interval").notNull().default(10), // minutes
  isRunning: boolean("is_running").notNull().default(false),
  lastRunAt: timestamp("last_run_at"),
});

export const systemStats = pgTable("system_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailsProcessed: integer("emails_processed").notNull().default(0),
  tasksCreated: integer("tasks_created").notNull().default(0),
  successRate: integer("success_rate").notNull().default(0), // percentage
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  processedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
});

export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemStats = typeof systemStats.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;
