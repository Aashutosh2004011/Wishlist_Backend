import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { wishlist, deals } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { addToWishlistSchema, dealIdParamSchema } from '../validators/wishlist.js';
import { trackWishlistEvent } from '../services/analytics.js';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const wishlistItems = await db
      .select({
        id: wishlist.id,
        dealId: wishlist.dealId,
        alertEnabled: wishlist.alertEnabled,
        createdAt: wishlist.createdAt,
        deal: {
          id: deals.id,
          title: deals.title,
          description: deals.description,
          originalPrice: deals.originalPrice,
          currentPrice: deals.currentPrice,
          discountPercentage: deals.discountPercentage,
          imageUrl: deals.imageUrl,
          merchantName: deals.merchantName,
          merchantUrl: deals.merchantUrl,
          category: deals.category,
          isActive: deals.isActive,
          isExpired: deals.isExpired,
          expiresAt: deals.expiresAt,
          updatedAt: deals.updatedAt,
        },
      })
      .from(wishlist)
      .innerJoin(deals, eq(wishlist.dealId, deals.id))
      .where(eq(wishlist.userId, userId))
      .orderBy(wishlist.createdAt);

    const formattedWishlist = wishlistItems.map((item) => ({
      id: item.id,
      dealId: item.dealId,
      alertEnabled: item.alertEnabled,
      createdAt: item.createdAt,
      deal: {
        ...item.deal,
        bestAvailablePrice: item.deal.currentPrice,
        status: item.deal.isExpired
          ? 'expired'
          : !item.deal.isActive
          ? 'disabled'
          : 'active',
      },
    }));

    res.json({
      success: true,
      data: formattedWishlist,
      count: formattedWishlist.length,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

router.post(
  '/',
  authenticate,
  validateBody(addToWishlistSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { dealId, alertEnabled } = req.body;

      const [deal] = await db
        .select()
        .from(deals)
        .where(eq(deals.id, dealId))
        .limit(1);

      if (!deal) {
        res.status(404).json({ error: 'Deal not found' });
        return;
      }

      const [existingWishlistItem] = await db
        .select()
        .from(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.dealId, dealId)))
        .limit(1);

      if (existingWishlistItem) {
        res.status(200).json({
          success: true,
          message: 'Deal already in wishlist',
          data: existingWishlistItem,
        });
        return;
      }

      let finalAlertEnabled = false;
      if (alertEnabled) {
        if (!req.user!.isSubscriber) {
          res.status(403).json({
            error: 'Alerts are only available for subscribers',
            message: 'Please upgrade to a subscription to enable deal alerts',
            code: 'SUBSCRIBER_REQUIRED',
          });
          return;
        }
        finalAlertEnabled = true;
      }

      const [newWishlistItem] = await db
        .insert(wishlist)
        .values({
          userId,
          dealId,
          alertEnabled: finalAlertEnabled,
        })
        .returning();

      await trackWishlistEvent({
        userId,
        dealId,
        action: 'add',
        metadata: { alertEnabled: finalAlertEnabled },
      });

      res.status(201).json({
        success: true,
        message: 'Deal added to wishlist',
        data: newWishlistItem,
      });
    } catch (error: any) {
      console.error('Add to wishlist error:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Deal already in wishlist' });
        return;
      }

      res.status(500).json({ error: 'Failed to add deal to wishlist' });
    }
  }
);

router.delete(
  '/:dealId',
  authenticate,
  validateParams(dealIdParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { dealId } = req.params;

      const [existingWishlistItem] = await db
        .select()
        .from(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.dealId, dealId)))
        .limit(1);

      if (!existingWishlistItem) {
        res.status(404).json({ error: 'Wishlist item not found' });
        return;
      }

      await db
        .delete(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.dealId, dealId)));

      await trackWishlistEvent({
        userId,
        dealId,
        action: 'remove',
      });

      res.json({
        success: true,
        message: 'Deal removed from wishlist',
      });
    } catch (error) {
      console.error('Delete from wishlist error:', error);
      res.status(500).json({ error: 'Failed to remove deal from wishlist' });
    }
  }
);

export default router;
