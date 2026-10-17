import { users, folders, documents, documentShares, activityLogs, documentStars, type User, type InsertUser, type Folder, type InsertFolder, type Document, type InsertDocument, type DocumentShare, type InsertDocumentShare, type ActivityLog, type InsertActivityLog, type DocumentStar, type InsertDocumentStar } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, like, sql, gt, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByLoginCode(loginCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastActive(id: string): Promise<void>;
  generateLoginCode(): Promise<string>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Folder operations
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolder(id: string): Promise<Folder | undefined>;
  getFolderByName(name: string): Promise<Folder | undefined>;
  getUserFolders(userId: string): Promise<Folder[]>;
  getAllFolders(): Promise<Folder[]>;
  updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<boolean>;
  verifyFolderAccess(folderId: string, securityCode?: string): Promise<boolean>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  getFolderDocuments(folderId: string): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  searchDocuments(query: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  getDocumentCount(documentType: string): Promise<number>;
  getDocumentCountByTypeAndYear(documentType: string, year: number): Promise<number>;
  updateDocumentContent(id: string, content: any): Promise<Document | undefined>;
  generatePDF(document: Document): Promise<Buffer>;
  
  // Document sharing
  shareDocument(share: InsertDocumentShare): Promise<DocumentShare>;
  getDocumentShares(documentId: string): Promise<DocumentShare[]>;
  getUserSharedDocuments(userId: string): Promise<Document[]>;
  removeDocumentShare(id: string): Promise<boolean>;
  
  // Activity logging
  createActivityLog(log: InsertActivityLog & { userId: string }): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;
  
  // Document starring
  starDocument(documentId: string, userId: string): Promise<DocumentStar>;
  unstarDocument(documentId: string, userId: string): Promise<boolean>;
  getUserStarredDocuments(userId: string): Promise<Document[]>;
  isDocumentStarred(documentId: string, userId: string): Promise<boolean>;
  
  // Statistics
  getDocumentStats(): Promise<{
    pressReleases: number;
    memos: number;
    letters: number;
    contracts: number;
    followups: number;
    total: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByLoginCode(loginCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.loginCode, loginCode));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLastActive(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date().toISOString() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log('[storage] Starting user deletion for ID:', id);
      
      // First, delete all related records to avoid foreign key constraints
      
      // 1. Delete user's document stars
      await db.delete(documentStars).where(eq(documentStars.userId, id));
      console.log('[storage] Deleted user document stars');
      
      // 2. Delete user's activity logs
      await db.delete(activityLogs).where(eq(activityLogs.userId, id));
      console.log('[storage] Deleted user activity logs');
      
      // 3. Delete document shares created by this user
      await db.delete(documentShares).where(eq(documentShares.sharedBy, id));
      console.log('[storage] Deleted document shares created by user');
      
      // 4. Delete document shares shared with this user
      await db.delete(documentShares).where(eq(documentShares.sharedWith, id));
      console.log('[storage] Deleted document shares shared with user');
      
      // 5. For documents uploaded by this user, either delete them or reassign to admin
      // Let's reassign to the first admin user we can find
      const adminUsers = await db.select().from(users).where(eq(users.role, 'super_admin')).limit(1);
      if (adminUsers.length > 0) {
        const adminId = adminUsers[0].id;
        // Reassign documents to admin instead of deleting them
        await db
          .update(documents)
          .set({ uploadedBy: adminId })
          .where(eq(documents.uploadedBy, id));
        console.log('[storage] Reassigned user documents to admin');
      } else {
        // If no admin found, delete the documents
        await db.delete(documents).where(eq(documents.uploadedBy, id));
        console.log('[storage] Deleted user documents (no admin to reassign to)');
      }
      
      // 6. Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      const success = Array.isArray(result) ? result.length > 0 : Boolean(result);
      
      console.log('[storage] User deletion completed successfully:', success);
      return success;
      
    } catch (error) {
      console.error('[storage] Error during user deletion:', error);
      throw error;
    }
  }

  // Folder operations implementation
  async createFolder(insertFolder: InsertFolder & { createdBy: string }): Promise<Folder> {
    try {
      console.log('[storage] Creating folder with data:', insertFolder);
      const folderData = {
        ...insertFolder,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('[storage] Prepared folder data:', folderData);
      const [folder] = await db
        .insert(folders)
        .values(folderData)
        .returning();
      console.log('[storage] Folder created successfully:', folder);
      return folder;
    } catch (error) {
      console.error('[storage] Error creating folder:', error);
      throw error;
    }
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getFolderByName(name: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.name, name));
    return folder || undefined;
  }

  async getUserFolders(userId: string): Promise<Folder[]> {
    return await db.select().from(folders).where(eq(folders.createdBy, userId)).orderBy(desc(folders.createdAt));
  }

  async getAllFolders(): Promise<Folder[]> {
    return await db.select().from(folders).orderBy(desc(folders.createdAt));
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(folders.id, id))
      .returning();
    return folder || undefined;
  }

  async deleteFolder(id: string): Promise<boolean> {
    const result = await db.delete(folders).where(eq(folders.id, id));
    return Array.isArray(result) ? result.length > 0 : Boolean(result);
  }

  async verifyFolderAccess(folderId: string, securityCode?: string): Promise<boolean> {
    const folder = await this.getFolder(folderId);
    if (!folder) return false;
    
    if (!folder.hasSecurityCode) return true;
    
    return folder.securityCode === securityCode;
  }

  async getFolderDocuments(folderId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.folderId, folderId)).orderBy(desc(documents.createdAt));
  }

  async generateLoginCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = `ZT-${Math.random().toString(36).substr(2, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      const existing = await this.getUserByLoginCode(code);
      
      if (!existing) {
        return code;
      }
      attempts++;
    }
    
    // Fallback to UUID-based code
    return `ZT-${randomUUID().substr(0, 8).toUpperCase()}`;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createDocument(insertDocument: InsertDocument & { uploadedBy: string }): Promise<Document> {
    try {
      console.log('[storage] Creating document with data:', insertDocument);
      const documentData = {
        ...insertDocument,
        id: insertDocument.id || randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('[storage] Prepared document data:', documentData);
      const [document] = await db
        .insert(documents)
        .values(documentData)
        .returning();
      console.log('[storage] Document created successfully:', document);
      return document;
    } catch (error) {
      console.error('[storage] Error creating document:', error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.uploadedBy, userId))
      .orderBy(desc(documents.updatedAt));
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.updatedAt));
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.category, category))
      .orderBy(desc(documents.updatedAt));
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        or(
          like(documents.name, `%${query}%`),
          like(documents.originalName, `%${query}%`)
        )
      )
      .orderBy(desc(documents.updatedAt));
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return Array.isArray(result) ? result.length > 0 : Boolean(result);
  }

  async shareDocument(insertShare: InsertDocumentShare & { sharedBy: string }): Promise<DocumentShare> {
    const [share] = await db
      .insert(documentShares)
      .values({ ...insertShare, id: randomUUID() })
      .returning();
    return share;
  }

  async getDocumentShares(documentId: string): Promise<DocumentShare[]> {
    return await db
      .select()
      .from(documentShares)
      .where(eq(documentShares.documentId, documentId));
  }

  async getUserSharedDocuments(userId: string): Promise<Document[]> {
    const sharedDocs = await db
      .select({ document: documents })
      .from(documents)
      .innerJoin(documentShares, eq(documents.id, documentShares.documentId))
      .where(eq(documentShares.sharedWith, userId))
      .orderBy(desc(documents.updatedAt));
    
    return sharedDocs.map(item => item.document);
  }

  async removeDocumentShare(id: string): Promise<boolean> {
    const result = await db.delete(documentShares).where(eq(documentShares.id, id));
    return Array.isArray(result) ? result.length > 0 : Boolean(result);
  }

  async createActivityLog(insertLog: InsertActivityLog & { userId: string }): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values({ ...insertLog, id: randomUUID() })
      .returning();
    return log;
  }

  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getUserActivityLogs(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getDocumentStats() {
    try {
      console.log("[storage] Getting document stats...");
      
      // Get all documents first and count them manually to avoid complex SQL
      const allDocs = await db.select().from(documents);
      console.log("[storage] Total documents found:", allDocs.length);
      
      const stats = {
        pressReleases: allDocs.filter(doc => doc.category === 'press_release').length,
        memos: allDocs.filter(doc => doc.category === 'memo').length,
        letters: allDocs.filter(doc => doc.category === 'internal_letter' || doc.category === 'external_letter').length,
        contracts: allDocs.filter(doc => doc.category === 'contract').length,
        followups: allDocs.filter(doc => doc.category === 'follow_up').length,
        reports: allDocs.filter(doc => doc.category === 'report').length,
        total: allDocs.length,
      };
      
      console.log("[storage] Stats computed:", stats);
      return stats;
    } catch (error) {
      console.error("[storage] Error in getDocumentStats:", error);
      throw error;
    }
  }

  async getDocumentCount(documentType: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.category, documentType));
    return Number(result.count) || 0;
  }

  async getDocumentCountByTypeAndYear(documentType: string, year: number): Promise<number> {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;
    
    const [result] = await db
      .select({ count: count() })
      .from(documents)
      .where(
        and(
          eq(documents.category, documentType),
          and(
            sql`${documents.createdAt} >= ${yearStart}`,
            sql`${documents.createdAt} < ${yearEnd}`
          )
        )
      );
    return Number(result.count) || 0;
  }

  async updateDocumentContent(id: string, content: any): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ 
        content: typeof content === 'string' ? content : JSON.stringify(content),
        updatedAt: new Date().toISOString() 
      })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async generatePDF(document: Document): Promise<Buffer> {
    // Parse document content if it's JSON
    let formattedContent = '';
    try {
      const parsedContent = typeof document.content === 'string' ? JSON.parse(document.content) : document.content;
      if (parsedContent && typeof parsedContent === 'object') {
        if (parsedContent.title) {
          formattedContent += `${parsedContent.title}\n\n`;
        }
        if (parsedContent.body) {
          formattedContent += `${parsedContent.body}\n\n`;
        }
        if (parsedContent.description) {
          formattedContent += `${parsedContent.description}\n\n`;
        }
        // Add any other fields cleanly
        Object.keys(parsedContent).forEach(key => {
          if (!['title', 'body', 'description'].includes(key)) {
            formattedContent += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${parsedContent[key]}\n\n`;
          }
        });
      } else {
        formattedContent = document.content || 'No content available';
      }
    } catch (error) {
      formattedContent = document.content || 'No content available';
    }

    const categoryDisplayName = document.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const createdDate = new Date(document.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const pdfContent = `


                                                                    ┌───────────────┐
                                                                    │      /\\       │
 ZEOLF TECHNOLOGY                                                   │     /  \\      │
 Document Management System                                         │    /____\\     │
 ─────────────────────────────                                     │               │
 Prioritize scie.ttech                                              │    ZEOLF      │
                                                                    │               │
                                                                    └───────────────┘



═══════════════════════════════════════════════════════════════════════════════════


 ${document.name}
 ─────────────────────────────────────────────────────────────


 DOCUMENT DETAILS
 ────────────────

 Document Code      │  ${document.documentCode || 'Generated automatically'}
 Category           │  ${categoryDisplayName}
 File Type          │  ${document.fileType.toUpperCase()}
 Created            │  ${createdDate}
 Status             │  Active


 CONTENT
 ───────

${formattedContent.split('\n').map(line => ` ${line}`).join('\n')}


 DOCUMENT METADATA
 ─────────────────

 Original Name      │  ${document.originalName}
 File Size          │  ${document.fileSize} bytes
 Upload Date        │  ${createdDate}
 Last Modified      │  ${new Date(document.updatedAt).toLocaleDateString('en-US', {
   year: 'numeric',
   month: 'long',
   day: 'numeric'
 })}
 Generated          │  ${generatedDate}


═══════════════════════════════════════════════════════════════════════════════════


                              ZEOLF Technology
                        Document Management System

                           Document ID: ${document.id}


═══════════════════════════════════════════════════════════════════════════════════
    `;
    
    return Buffer.from(pdfContent, 'utf-8');
  }

  // Document starring functions
  async starDocument(documentId: string, userId: string): Promise<DocumentStar> {
    try {
      console.log('[storage] Starring document:', documentId, 'for user:', userId);
      const starData = {
        id: randomUUID(),
        documentId,
        userId,
        createdAt: new Date().toISOString()
      };
      const [star] = await db
        .insert(documentStars)
        .values(starData)
        .returning();
      console.log('[storage] Document starred successfully:', star);
      return star;
    } catch (error) {
      console.error('[storage] Error starring document:', error);
      throw error;
    }
  }

  async unstarDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      console.log('[storage] Unstarring document:', documentId, 'for user:', userId);
      const result = await db
        .delete(documentStars)
        .where(and(eq(documentStars.documentId, documentId), eq(documentStars.userId, userId)));
      const success = Array.isArray(result) ? result.length > 0 : Boolean(result);
      console.log('[storage] Document unstarred:', success);
      return success;
    } catch (error) {
      console.error('[storage] Error unstarring document:', error);
      throw error;
    }
  }

  async getUserStarredDocuments(userId: string): Promise<Document[]> {
    try {
      console.log('[storage] Getting starred documents for user:', userId);
      const starredDocs = await db
        .select({ document: documents })
        .from(documents)
        .innerJoin(documentStars, eq(documents.id, documentStars.documentId))
        .where(eq(documentStars.userId, userId))
        .orderBy(desc(documentStars.createdAt));
      
      const result = starredDocs.map(item => item.document);
      console.log('[storage] Found starred documents:', result.length);
      return result;
    } catch (error) {
      console.error('[storage] Error getting starred documents:', error);
      throw error;
    }
  }

  async isDocumentStarred(documentId: string, userId: string): Promise<boolean> {
    try {
      const [star] = await db
        .select()
        .from(documentStars)
        .where(and(eq(documentStars.documentId, documentId), eq(documentStars.userId, userId)));
      return !!star;
    } catch (error) {
      console.error('[storage] Error checking if document is starred:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
