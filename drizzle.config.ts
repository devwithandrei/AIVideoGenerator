import type { Config } from 'drizzle-kit';
import { parse } from 'pg-connection-string';

const dbUrl = process.env.DATABASE_URL || '';
const pgConfig = dbUrl ? parse(dbUrl) : { host: '', port: null as any, user: '', password: '', database: '' };

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: pgConfig.host || 'localhost',
    port: Number(pgConfig.port || 5432),
    user: pgConfig.user || '',
    password: pgConfig.password || '',
    database: pgConfig.database || '',
    ssl: dbUrl.includes('sslmode=require') || dbUrl.includes('neon.') ? true : (dbUrl ? undefined : false) as any,
  },
  verbose: true,
  strict: true,
} satisfies Config;