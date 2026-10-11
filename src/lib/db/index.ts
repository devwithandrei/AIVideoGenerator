import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';

// Database connection string from environment variables
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database operations will fail.');
}

/**
 * The neon-serverless driver uses HTTP/WebSocket transport and requires the
 * DIRECT (non-pooler) Neon endpoint. The "-pooler" endpoint is a PgBouncer
 * TCP proxy that does not expose the HTTP /sql API, causing
 * "could not parse the HTTP request body: data did not match any variant of
 * untagged enum Payload". We also strip native-only params like
 * channel_binding/sslmode that the HTTP driver rejects.
 */
function sanitizeConnectionString(url: string): string {
  try {
    const u = new URL(url);
    // Convert pooler endpoint to direct endpoint (remove "-pooler" suffix)
    if (u.hostname.includes('-pooler.')) {
      u.hostname = u.hostname.replace('-pooler.', '.');
    }
    // Remove params unsupported by the HTTP serverless driver
    ['channel_binding', 'sslmode'].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

if (connectionString) {
  connectionString = sanitizeConnectionString(connectionString);
}

// Force Pool queries to use fetch (HTTP) instead of WebSocket, which is
// required in serverless environments where WebSocket connections may fail.
neonConfig.poolQueryViaFetch = true;

// Create the database client with error handling.
// drizzle's neon-serverless driver accepts a connection string directly and
// creates a Pool internally. Passing the neon() tagged-template function is
// incompatible (it has no .query() method).
let db: any = null;

try {
  if (connectionString) {
    db = drizzle(connectionString, { schema });
  }
} catch (error) {
  console.error('Failed to initialize database connection:', error);
}

// Export a safe database instance
export { db };

// Export schema for migrations
export * from './schema';