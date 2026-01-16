import { z } from 'zod';

export const addToWishlistSchema = z.object({
  dealId: z.string().uuid({ message: 'Invalid deal ID format' }),
  alertEnabled: z.boolean().optional().default(false),
});

export const updateWishlistSchema = z.object({
  alertEnabled: z.boolean(),
});

export const dealIdParamSchema = z.object({
  dealId: z.string().uuid({ message: 'Invalid deal ID format' }),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
export type DealIdParam = z.infer<typeof dealIdParamSchema>;
