import { db } from './index';
import { CreditService } from '@/lib/services/credit-service';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Initialize default feature pricing
    await CreditService.initializeDefaultPricing();
    console.log('✅ Default feature pricing initialized');

    // Initialize default credit packages
    await CreditService.initializeDefaultPackages();
    console.log('✅ Default credit packages initialized');

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
} 