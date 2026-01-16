# Database Migration Instructions

## Issue
The automatic migration script is experiencing connection timeouts to Supabase. This is likely due to network/firewall restrictions or Supabase pooler configuration.

## Solution Options

### Option 1: Run SQL Manually in Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy the entire contents of `src/db/migrations/0000_sad_eternals.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

The migration SQL creates these tables:
- `users` - User accounts
- `deals` - Product deals
- `wishlist` - User wishlists
- `wishlist_analytics` - Analytics tracking

### Option 2: Use Direct Connection (Not Pooler)

If you have a direct database connection URL (not the pooler):

1. In your `.env` file, look for the database connection
2. The current URL uses `:6543` (pooler port)
3. Try changing to `:5432` (direct port) if available:

```env
# Current (pooler)
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Try (direct)
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-southeast-1.supabase.com:5432/postgres
```

Then run:
```bash
npm run db:migrate
```

### Option 3: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

### Option 4: Check Network/Firewall

The connection timeout might be due to:
- VPN or firewall blocking outbound connections to port 6543
- Corporate network restrictions
- ISP blocking certain ports

Try:
1. Disable VPN if using one
2. Try from a different network
3. Check if you can telnet to the database:
   ```bash
   telnet aws-1-ap-southeast-1.pooler.supabase.com 6543
   ```

## Verification

After running the migration by any method, verify it worked:

1. Go to Supabase Dashboard → Table Editor
2. You should see 4 tables: `users`, `deals`, `wishlist`, `wishlist_analytics`

## Next Steps

Once migrations are complete, you can:

1. **Seed the database**:
   ```bash
   npm run db:seed
   ```

2. **Start the backend**:
   ```bash
   npm run dev
   ```

## Migration SQL File

The migration file is located at:
```
src/db/migrations/0000_sad_eternals.sql
```

This file is safe to run multiple times as it uses `IF NOT EXISTS` clauses.