import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Database connection string from environment variables
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database operations will fail.');
}

/**
 * The neon-serverless driver uses HTTP/WebSocket transport and does NOT support
 * native PostgreSQL parameters like `channel_binding`. Strip them to avoid
 * "Neon HTTP transport error" on Vercel.
 */
function sanitizeConnectionString(url: string): string {
  try {
    const u = new URL(url);
    // Remove params unsupported by the HTTP serverless driver
    ['channel_binding', 'sslmode'].forEach((k) => u.searchParams.delete(k));
    // neon-serverless handles SSL internally; ensure no conflicting params
    return u.toString();
  } catch {
    return url;
  }
}

if (connectionString) {
  connectionString = sanitizeConnectionString(connectionString);
}

// Create the database client with error handling
let sql: any = null;
let db: any = null;

try {
  if (connectionString) {
    sql = neon(connectionString);
    db = drizzle(sql, { schema });
  }
} catch (error) {
  console.error('Failed to initialize database connection:', error);
}

// Export a safe database instance
export { db };

// Export schema for migrations
export * from './schema';