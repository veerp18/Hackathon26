import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './client';

async function runMigration() {
  try {
    console.log('Running database migrations...');
    
    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
