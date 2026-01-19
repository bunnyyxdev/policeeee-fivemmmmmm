/**
 * Drop Email Index Script
 * 
 * This script removes the email index from the users collection
 * to fix the duplicate key error after removing email field from the schema.
 * 
 * Run this script:
 *   npx ts-node --compiler-options {"module":"commonjs"} scripts/drop-email-index.ts
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';

async function dropEmailIndex() {
  console.log('\n🗑️  Dropping email index from users collection...');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database not connected');
    }

    const usersCollection = db.collection('users');
    
    // List all indexes first
    const indexes = await usersCollection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Try to drop the email index
    try {
      await usersCollection.dropIndex('email_1');
      console.log('\n✅ Successfully dropped email_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('\n⚠️  email_1 index not found (may have been already dropped)');
      } else {
        throw error;
      }
    }

    // Also try to drop any partial index that might exist
    try {
      // Check if there's a partial index on email
      const emailIndexes = indexes.filter((idx: any) => 
        idx.key && idx.key.email !== undefined
      );
      
      for (const index of emailIndexes) {
        if (index.name && index.name !== 'email_1') {
          await usersCollection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        }
      }
    } catch (error: any) {
      console.log('⚠️  No additional email indexes to drop');
    }

    // Show final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await usersCollection.indexes();
    finalIndexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Email index removal completed!');
  } catch (error: any) {
    console.error('\n❌ Error dropping email index:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  dropEmailIndex().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { dropEmailIndex };
