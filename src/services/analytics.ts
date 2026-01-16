import { db } from '../db/index.js';
import { wishlistAnalytics } from '../db/schema.js';

interface AnalyticsEvent {
  userId: string;
  dealId: string;
  action: 'add' | 'remove' | 'alert_enabled' | 'alert_disabled';
  metadata?: Record<string, any>;
}

export const trackWishlistEvent = async ({
  userId,
  dealId,
  action,
  metadata,
}: AnalyticsEvent): Promise<void> => {
  try {
    await db.insert(wishlistAnalytics).values({
      userId,
      dealId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
};
