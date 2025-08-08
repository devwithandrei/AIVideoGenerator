import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database operations will fail.');
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