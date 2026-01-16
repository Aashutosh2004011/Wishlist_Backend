import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
  const connectionString = process.env.DATABASE_URL!;

  console.log('🔄 Connecting to database...');

  // Create a dedicated connection for migrations
  const migrationClient = postgres(connectionString, {
    max: 1,
    onnotice: () => {}, // Suppress notices
  });

  const db = drizzle(migrationClient);

  console.log('🔄 Running migrations...');

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed!');
    throw error;
  } finally {
    // Ensure connection is properly closed
    await migrationClient.end({ timeout: 5 });
  }
};

runMigration()
  .then(() => {
    console.log('✅ Migration process finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration process failed!');
    console.error(err);
    process.exit(1);
  });
