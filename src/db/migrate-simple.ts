import postgres from 'postgres';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const runMigration = async () => {
  const connectionString = process.env.DATABASE_URL!;

  console.log('🔄 Connecting to database...');

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('🔄 Reading migration file...');
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '0000_sad_eternals.sql'),
      'utf-8'
    );

    console.log('🔄 Executing migration...');

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await sql.unsafe(statement);
    }

    console.log('✅ Migration completed successfully!');
    console.log(`   Executed ${statements.length} statements`);
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist, skipping...');
    } else {
      console.error('❌ Migration failed!');
      throw error;
    }
  } finally {
    await sql.end();
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