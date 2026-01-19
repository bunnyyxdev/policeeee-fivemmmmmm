/**
 * Database Initialization Script
 * 
 * This script initializes the database with default data:
 * - Creates admin user if it doesn't exist
 * - Sets up indexes
 * 
 * Run this script once on first setup:
 *   npm run init-db
 * 
 * Or directly:
 *   npx ts-node --compiler-options {"module":"commonjs"} scripts/initialize-db.ts
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import User from '../models/User';
import { hashPassword } from '../lib/auth';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'administrator';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'exampleadminpassword';

async function initializeAdminUser() {
  console.log('\n👤 Checking admin user...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await (User as any).findOne({ 
      username: ADMIN_USERNAME, 
      role: 'admin' 
    });

    if (existingAdmin) {
      console.log(`   ✅ Admin user "${ADMIN_USERNAME}" already exists`);
      return;
    }

    // Create admin user
    console.log(`   📝 Creating admin user "${ADMIN_USERNAME}"...`);
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    
    const adminUser = await (User as any).create({
      username: ADMIN_USERNAME,
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
    });

    console.log(`   ✅ Admin user created successfully!`);
    console.log(`   📋 Username: ${adminUser.username}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`   ⚠️  Please change the default password after first login!`);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log(`   ⚠️  Admin user "${ADMIN_USERNAME}" already exists (duplicate key)`);
    } else {
      console.error('   ❌ Error creating admin user:', error.message);
      throw error;
    }
  }
}

async function ensureIndexes() {
  console.log('\n📊 Ensuring database indexes...');
  
  try {
    // User model indexes are defined in the schema, but we can sync them
    await User.syncIndexes();
    console.log('   ✅ User indexes synced');
  } catch (error: any) {
    console.error('   ❌ Error syncing indexes:', error.message);
    throw error;
  }
}

async function showDatabaseInfo() {
  console.log('\n📊 Database Information:');
  
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      console.log('   ❌ Database not connected');
      return;
    }

    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    
    console.log(`   📦 Database: ${dbName}`);
    console.log(`   📚 Collections: ${collections.length}`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`      - ${collection.name}: ${count} documents`);
    }
  } catch (error: any) {
    console.error('   ❌ Error getting database info:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Database Initialization...\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Show current database state
    await showDatabaseInfo();

    // Initialize admin user
    await initializeAdminUser();

    // Ensure indexes
    await ensureIndexes();

    // Show final database state
    await showDatabaseInfo();

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure to change the default admin password after first login');
    console.log('   2. Create additional users through the admin panel');
    console.log('   3. Run "npm run update-db" to update indexes if needed');
  } catch (error: any) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { initializeAdminUser, ensureIndexes };
