import { neon } from '@neondatabase/serverless';

// sql is null when DATABASE_URL is absent (local dev — JSON files used instead)
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;
