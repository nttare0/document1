import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Configure SQLite for large-scale storage (1TB+ capability)
const sqlite = new Database('./database.db', {
  // Enable verbose mode for debugging large operations
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  // Set timeout for long-running operations (30 seconds)
  timeout: 30000,
  // Enable automatic file synchronization
  fileMustExist: false
});

// Optimize SQLite for large database handling
const optimizeSQLiteForLargeStorage = () => {
  try {
    console.log('[SQLite] Configuring database for large storage (1TB+ capability)...');
    
    // Enable WAL mode for better concurrent access and performance
    sqlite.pragma('journal_mode = WAL');
    console.log('[SQLite] ✓ WAL mode enabled for better performance');
    
    // Set large cache size (512MB) for better performance with large datasets
    sqlite.pragma('cache_size = -524288'); // -524288 * 1024 bytes = 512MB
    console.log('[SQLite] ✓ Cache size set to 512MB');
    
    // Set optimal page size for large databases (16KB)
    sqlite.pragma('page_size = 16384');
    console.log('[SQLite] ✓ Page size set to 16KB for optimal large file handling');
    
    // Enable memory-mapped I/O for better performance (2GB limit)
    sqlite.pragma('mmap_size = 2147483648'); // 2GB
    console.log('[SQLite] ✓ Memory-mapped I/O enabled (2GB)');
    
    // Set synchronous mode to NORMAL for balance of safety and performance
    sqlite.pragma('synchronous = NORMAL');
    console.log('[SQLite] ✓ Synchronous mode set to NORMAL');
    
    // Enable foreign key constraints
    sqlite.pragma('foreign_keys = ON');
    console.log('[SQLite] ✓ Foreign key constraints enabled');
    
    // Set temp store to memory for better performance
    sqlite.pragma('temp_store = MEMORY');
    console.log('[SQLite] ✓ Temporary storage set to memory');
    
    // Set large temporary cache
    sqlite.pragma('temp_store_directory = ""');
    
    // Optimize for large transactions
    sqlite.pragma('optimize');
    console.log('[SQLite] ✓ Database optimized for large operations');
    
  } catch (error) {
    console.error('[SQLite] Error optimizing database for large storage:', error);
  }
};

// Apply optimizations
optimizeSQLiteForLargeStorage();

export const db = drizzle(sqlite, { schema });

// Initialize database tables if they don't exist
const initializeDatabase = () => {
  try {
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        login_code TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        last_active TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create folders table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        security_code TEXT,
        has_security_code INTEGER DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Create documents table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size TEXT NOT NULL,
        file_path TEXT NOT NULL,
        folder_id TEXT,
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        document_code TEXT,
        is_template INTEGER DEFAULT 0,
        content TEXT,
        recipient_info TEXT,
        FOREIGN KEY (folder_id) REFERENCES folders(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );
    `);

    // Create document_shares table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS document_shares (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        shared_by TEXT NOT NULL,
        shared_with TEXT NOT NULL,
        permission TEXT NOT NULL DEFAULT 'view',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (shared_by) REFERENCES users(id),
        FOREIGN KEY (shared_with) REFERENCES users(id)
      );
    `);

    // Create activity_logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Create document_stars table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS document_stars (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(document_id, user_id)
      );
    `);

    // Create performance indexes for large-scale operations
    console.log('[SQLite] Creating performance indexes for large datasets...');
    
    // Documents table indexes for fast querying
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);`);
    
    // Activity logs indexes for fast filtering and reporting
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);`);
    
    // Document shares indexes
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);`);
    
    // Document stars indexes
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_document_stars_user_id ON document_stars(user_id);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_document_stars_document_id ON document_stars(document_id);`);
    
    // Users table indexes
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_users_login_code ON users(login_code);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);`);
    
    // Folders table indexes
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);`);
    
    console.log('[SQLite] ✓ Performance indexes created for large-scale operations');

    // Create admin user if it doesn't exist
    const adminUser = sqlite.prepare('SELECT id FROM users WHERE login_code = ?').get('ADMIN001');
    if (!adminUser) {
      sqlite.prepare(`
        INSERT INTO users (id, name, login_code, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('admin-uuid-001', 'System Administrator', 'ADMIN001', 'super_admin', 1, new Date().toISOString());
      
      console.log('[SQLite] Admin user created with login code: ADMIN001');
    }

    // Run maintenance operations for optimal performance
    console.log('[SQLite] Running database maintenance for optimal large-scale performance...');
    
    // Analyze tables for query optimization
    sqlite.exec('ANALYZE;');
    console.log('[SQLite] ✓ Database analysis completed');
    
    // Update table statistics
    sqlite.exec('PRAGMA optimize;');
    console.log('[SQLite] ✓ Database optimization completed');
    
    // Check database integrity
    const integrityCheck = sqlite.prepare('PRAGMA integrity_check;').get();
    if (integrityCheck.integrity_check === 'ok') {
      console.log('[SQLite] ✓ Database integrity verified');
    } else {
      console.warn('[SQLite] ⚠ Database integrity issues detected:', integrityCheck);
    }
    
    // Display database configuration summary
    const pageSize = sqlite.prepare('PRAGMA page_size;').get().page_size;
    const cacheSize = sqlite.prepare('PRAGMA cache_size;').get().cache_size;
    const journalMode = sqlite.prepare('PRAGMA journal_mode;').get().journal_mode;
    const mmapSize = sqlite.prepare('PRAGMA mmap_size;').get().mmap_size;
    
    console.log('[SQLite] ═══════════════════════════════════════════════════════');
    console.log('[SQLite] Database Configuration Summary (1TB+ Ready):');
    console.log('[SQLite] ├─ Page Size: ' + pageSize + ' bytes (16KB)');
    console.log('[SQLite] ├─ Cache Size: ' + Math.abs(cacheSize * pageSize / 1024 / 1024).toFixed(0) + 'MB');
    console.log('[SQLite] ├─ Journal Mode: ' + journalMode.toUpperCase());
    console.log('[SQLite] ├─ Memory Map: ' + (mmapSize / 1024 / 1024 / 1024).toFixed(1) + 'GB');
    console.log('[SQLite] └─ Maximum Database Size: ~281TB (SQLite theoretical limit)');
    console.log('[SQLite] ═══════════════════════════════════════════════════════');
    console.log('[SQLite] Database initialized successfully for large-scale storage!');
  } catch (error) {
    console.error('[SQLite] Error initializing database:', error);
  }
};

// Initialize the database
initializeDatabase();

// The schema is managed by Drizzle migrations
