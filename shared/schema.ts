import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  loginCode: text("login_code").notNull().unique(),
  role: text("role").notNull().default("user"), // "super_admin" or "user"
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  lastActive: text("last_active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  securityCode: text("security_code"), // Optional security code for folder access
  hasSecurityCode: integer("has_security_code", { mode: 'boolean' }).default(false),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  description: text("description"), // Optional description for uploaded files
  category: text("category").notNull(), // "press_releases", "memos", "internal_letters", "contracts", "follow_ups"
  fileType: text("file_type").notNull(), // "pdf", "word", "excel", "powerpoint"
  fileSize: text("file_size").notNull(), // Using text to avoid BigInt issues
  filePath: text("file_path").notNull(),
  folderId: text("folder_id").references(() => folders.id), // Documents must belong to a folder
  uploadedBy: text("uploaded_by").references(() => users.id).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  metadata: text("metadata"), // for additional document properties, stored as JSON string
  // New fields for document creation
  documentCode: text("document_code"), // Auto-generated code (e.g., PR-2024-001, MEMO-2024-001)
  isTemplate: integer("is_template", { mode: 'boolean' }).default(false),
  content: text("content"), // Document content for online editing, stored as JSON string
  recipientInfo: text("recipient_info"), // For letters: name, address, title, stored as JSON string
});

export const documentShares = sqliteTable("document_shares", {
  id: text("id").primaryKey(),
  documentId: text("document_id").references(() => documents.id).notNull(),
  sharedBy: text("shared_by").references(() => users.id).notNull(),
  sharedWith: text("shared_with").references(() => users.id).notNull(),
  permission: text("permission").notNull().default("view"), // "view" or "edit"
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // "upload", "download", "view", "share", "edit"
  resourceType: text("resource_type").notNull(), // "document", "user", "system"
  resourceId: text("resource_id"),
  details: text("details"), // additional action details, stored as JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const documentStars = sqliteTable("document_stars", {
  id: text("id").primaryKey(),
  documentId: text("document_id").references(() => documents.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  loginCode: true,
  role: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  description: true,
  securityCode: true,
  hasSecurityCode: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  originalName: true,
  description: true,
  category: true,
  fileType: true,
  fileSize: true,
  filePath: true,
  folderId: true,
  metadata: true,
  documentCode: true,
  isTemplate: true,
  content: true,
  recipientInfo: true,
});

// Schema for document creation form
export const createDocumentSchema = z.object({
  documentType: z.enum(["press_release", "memo", "internal_letter", "external_letter", "contract", "follow_up", "report"]),
  title: z.string().min(1, "Title is required"),
  fileType: z.enum(["word", "excel", "powerpoint"]),
  recipientName: z.string().optional(),
  recipientAddress: z.string().optional(),
  recipientTitle: z.string().optional(),
  isInternal: z.boolean().default(true),
  folderId: z.string().optional(),
});

export const insertDocumentShareSchema = createInsertSchema(documentShares).pick({
  documentId: true,
  sharedWith: true,
  permission: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  action: true,
  resourceType: true,
  resourceId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export const insertDocumentStarSchema = createInsertSchema(documentStars).pick({
  documentId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type DocumentShare = typeof documentShares.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type DocumentStar = typeof documentStars.$inferSelect;

// Export insert types from zod schemas
export type CreateUser = z.infer<typeof insertUserSchema>;
export type CreateFolder = z.infer<typeof insertFolderSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type InsertDocumentShare = z.infer<typeof insertDocumentShareSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertDocumentStar = z.infer<typeof insertDocumentStarSchema>;
