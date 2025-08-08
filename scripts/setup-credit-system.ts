import { db } from '@/lib/db';
import { CreditService } from '@/lib/services/credit-service';
import { featurePricing, creditPackages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function setupCreditSystem() {
  console.log('🚀 Setting up credit system...');

  try {
    // Initialize default feature pricing
    console.log('📊 Initializing feature pricing...');
    await CreditService.initializeDefaultPricing();
    console.log('✅ Feature pricing initialized');

    // Initialize default credit packages
    console.log('📦 Initializing credit packages...');
    await CreditService.initializeDefaultPackages();
    console.log('✅ Credit packages initialized');

    // Verify setup
    console.log('🔍 Verifying setup...');
    
    const pricingCount = await db.select().from(featurePricing);
    const packagesCount = await db.select().from(creditPackages);
    
    console.log(`📊 Found ${pricingCount.length} feature pricing records`);
    console.log(`📦 Found ${packagesCount.length} credit packages`);

    console.log('🎉 Credit system setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up Stripe webhook endpoint: /api/stripe/webhook');
    console.log('2. Set up Clerk webhook endpoint: /api/webhooks/clerk');
    console.log('3. Configure environment variables');
    console.log('4. Test the credit system with a new user');

  } catch (error) {
    console.error('❌ Error setting up credit system:', error);
    process.exit(1);
  }
}

setupCreditSystem();
