import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

let supabase: SupabaseClient;

const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return supabase;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7);

    const { data: { user: supabaseUser }, error } = await getSupabaseClient().auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, supabaseUser.email!))
      .limit(1);

    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
          isSubscriber: false,
        })
        .returning();

      req.user = newUser;
    } else {
      req.user = existingUser;
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireSubscriber = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isSubscriber) {
    res.status(403).json({
      error: 'Subscriber access required',
      message: 'This feature is only available to subscribers'
    });
    return;
  }

  next();
};
