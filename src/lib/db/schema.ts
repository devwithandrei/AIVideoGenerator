import { pgTable, text, timestamp, integer, boolean, uuid, varchar } from 'drizzle-orm/pg-core';

// Users table - extends Clerk user data
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  role: text('role').notNull().default('user').$type<'admin' | 'user'>(),
  isActive: boolean('is_active').notNull().default(true),
  banned: boolean('banned').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Credits table - tracks user credit balance
export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),
  totalPurchased: integer('total_purchased').notNull().default(0),
  totalUsed: integer('total_used').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Credit transactions table - tracks all credit operations
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<'purchase' | 'usage' | 'refund' | 'bonus'>(),
  amount: integer('amount').notNull(), // positive for purchases, negative for usage
  description: text('description').notNull(),
  model: text('model'), // which AI model was used (hailuo, veo2, etc.)
  feature: text('feature'), // which feature was used (video-generation, map-animation, etc.)
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Usage tracking table - detailed usage logs
export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feature: text('feature').notNull().$type<'video-generation' | 'map-animation' | 'image-generation'>(),
  model: text('model').notNull(), // hailuo, veo2, etc.
  creditsUsed: integer('credits_used').notNull(),
  prompt: text('prompt'), // user's input prompt
  status: text('status').notNull().$type<'success' | 'failed' | 'cancelled'>(),
  errorMessage: text('error_message'),
  processingTime: integer('processing_time'), // in milliseconds
  inputSize: integer('input_size'), // size of input in bytes
  outputSize: integer('output_size'), // size of output in bytes
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Credit packages table - available credit packages for purchase
export const creditPackages = pgTable('credit_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  credits: integer('credits').notNull(),
  price: integer('price').notNull(), // price in cents
  currency: text('currency').notNull().default('USD'),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Purchase history table - tracks credit purchases
export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  packageId: uuid('package_id').references(() => creditPackages.id),
  amount: integer('amount').notNull(), // amount in cents
  currency: text('currency').notNull().default('USD'),
  credits: integer('credits').notNull(),
  status: text('status').notNull().$type<'pending' | 'completed' | 'failed' | 'refunded'>(),
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Feature pricing table - defines credit costs for different features
export const featurePricing = pgTable('feature_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  feature: text('feature').notNull().$type<'video-generation' | 'map-animation' | 'image-generation'>(),
  model: text('model').notNull(), // hailuo, veo2, etc.
  creditsPerUse: integer('credits_per_use').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type NewCreditPackage = typeof creditPackages.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type FeaturePricing = typeof featurePricing.$inferSelect;
export type NewFeaturePricing = typeof featurePricing.$inferInsert; 