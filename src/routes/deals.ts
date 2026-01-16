import { Router } from 'express';
import { db } from '../db/index.js';
import { deals } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { desc } from 'drizzle-orm';

const router = Router();

// GET /api/deals - Get all deals
router.get('/', authenticate, async (req, res) => {
  try {
    const allDeals = await db
      .select()
      .from(deals)
      .orderBy(desc(deals.createdAt));

    res.json(allDeals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

export default router;