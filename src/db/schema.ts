import { pgTable, uuid, text, timestamp, boolean, numeric, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  isSubscriber: boolean('is_subscriber').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }).notNull(),
  currentPrice: numeric('current_price', { precision: 10, scale: 2 }).notNull(),
  discountPercentage: integer('discount_percentage').notNull(),
  imageUrl: text('image_url'),
  merchantName: text('merchant_name').notNull(),
  merchantUrl: text('merchant_url').notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isExpired: boolean('is_expired').notNull().default(false),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const wishlist = pgTable('wishlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  alertEnabled: boolean('alert_enabled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userDealIdx: uniqueIndex('wishlist_user_deal_idx').on(table.userId, table.dealId),
}));

export const wishlistAnalytics = pgTable('wishlist_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  wishlist: many(wishlist),
  analytics: many(wishlistAnalytics),
}));

export const dealsRelations = relations(deals, ({ many }) => ({
  wishlist: many(wishlist),
  analytics: many(wishlistAnalytics),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [wishlist.dealId],
    references: [deals.id],
  }),
}));

export const wishlistAnalyticsRelations = relations(wishlistAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [wishlistAnalytics.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [wishlistAnalytics.dealId],
    references: [deals.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Wishlist = typeof wishlist.$inferSelect;
export type NewWishlist = typeof wishlist.$inferInsert;
export type WishlistAnalytics = typeof wishlistAnalytics.$inferSelect;
export type NewWishlistAnalytics = typeof wishlistAnalytics.$inferInsert;
