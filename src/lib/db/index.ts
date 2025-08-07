import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Database connection string from environment variables
const connectionString = process.env.DATABASE_URL!;

// Create the database client
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

// Export schema for migrations
export * from './schema'; 