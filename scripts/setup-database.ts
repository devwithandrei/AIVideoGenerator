import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const sql = neon(connectionString);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    console.log('Using connection string:', connectionString.substring(0, 50) + '...');
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'drizzle', '0000_yellow_storm.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split the SQL by statement breakpoints
    const statements = migrationSQL.split('--> statement-breakpoint').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await sql.query(statement);
    }
    
    console.log('✅ Database setup completed successfully!');
    
    // Initialize default data
    console.log('Initializing default data...');
    
    // Initialize default feature pricing
    const defaultPricing = [
      {
        feature: 'video-generation',
        model: 'hailuo',
        creditsPerUse: 10,
        description: 'Hailuo video generation (6s with sound)',
      },
      {
        feature: 'video-generation',
        model: 'veo2',
        creditsPerUse: 5,
        description: 'Veo2 video generation',
      },
      {
        feature: 'map-animation',
        model: 'hailuo',
        creditsPerUse: 8,
        description: 'Hailuo map animation',
      },
      {
        feature: 'map-animation',
        model: 'veo2',
        creditsPerUse: 4,
        description: 'Veo2 map animation',
      },
      {
        feature: 'image-generation',
        model: 'mock',
        creditsPerUse: 1,
        description: 'Mock image generation',
      },
    ];

    for (const pricing of defaultPricing) {
      await sql.query(`
        INSERT INTO feature_pricing (feature, model, credits_per_use, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [pricing.feature, pricing.model, pricing.creditsPerUse, pricing.description]);
    }
    
    // Initialize default credit packages
    const defaultPackages = [
      {
        name: 'Starter Pack',
        credits: 50,
        price: 999, // $9.99
        description: 'Perfect for trying out our features',
      },
      {
        name: 'Pro Pack',
        credits: 200,
        price: 2999, // $29.99
        description: 'Great for regular users',
      },
      {
        name: 'Enterprise Pack',
        credits: 1000,
        price: 9999, // $99.99
        description: 'For power users and businesses',
      },
    ];

    for (const pkg of defaultPackages) {
      await sql.query(`
        INSERT INTO credit_packages (name, credits, price, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [pkg.name, pkg.credits, pkg.price, pkg.description]);
    }
    
    console.log('✅ Default data initialized successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase()
  .then(() => {
    console.log('Database setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  }); 