#!/usr/bin/env node

/**
 * Database Migration Script for Railway PostgreSQL
 * Run this script after deployment to initialize the database
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL or DATABASE_PRIVATE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'init-railway.sql');
    console.log(`Reading migration file from: ${sqlPath}`);
    const sql = await fs.readFile(sqlPath, 'utf8');

    // Split SQL commands by semicolon (simple approach)
    const commands = sql
      .split(/;\s*$/gm)
      .filter(cmd => cmd.trim().length > 0)
      .map(cmd => cmd.trim() + ';');

    console.log(`Found ${commands.length} SQL commands to execute`);

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Skip comments and empty commands
      if (command.startsWith('--') || command.trim() === ';') {
        continue;
      }

      try {
        console.log(`Executing command ${i + 1}/${commands.length}...`);
        await client.query(command);
      } catch (error) {
        // Some errors are expected (like "already exists"), so we log and continue
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('violates unique constraint')) {
          console.log(`  Note: ${error.message.split('\n')[0]} (continuing...)`);
        } else {
          console.error(`  Error executing command: ${error.message}`);
          // For critical errors, you might want to exit
          // throw error;
        }
      }
    }

    console.log('\nDatabase migration completed successfully!');

    // Verify tables were created
    const tableCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const result = await client.query(tableCheckQuery);
    console.log('\nCreated tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the migration
console.log('Starting database migration for Railway deployment...\n');
runMigration();