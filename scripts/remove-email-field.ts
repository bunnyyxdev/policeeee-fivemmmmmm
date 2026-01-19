/**
 * Remove Email Field Script
 * 
 * This script removes the email field from all existing user documents
 * and ensures the email index is dropped.
 * 
 * Run this script:
 *   npm run remove-email-field
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';

async function removeEmailField() {
  console.log('\n🗑️  Removing email field from users collection...');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database not connected');
    }

    const usersCollection = db.collection('users');
    
    // First, drop the email index if it exists
    console.log('📋 Checking for email index...');
    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('⚠️  email_1 index not found (already dropped)');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Drop any partial indexes on email
    try {
      const indexes = await usersCollection.indexes();
      const emailIndexes = indexes.filter((idx: any) => 
        idx.key && idx.key.email !== undefined && idx.name !== 'email_1'
      );
      
      for (const index of emailIndexes) {
        if (index.name) {
          await usersCollection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        }
      }
    } catch (error: any) {
      console.log('⚠️  No additional email indexes to drop');
    }

    // Remove email field from all documents
    console.log('\n📝 Removing email field from all user documents...');
    const result = await usersCollection.updateMany(
      { email: { $exists: true } },
      { $unset: { email: "" } }
    );
    
    console.log(`✅ Removed email field from ${result.modifiedCount} document(s)`);

    // Show final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await usersCollection.indexes();
    finalIndexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Verify no documents have email field
    const docsWithEmail = await usersCollection.countDocuments({ email: { $exists: true } });
    if (docsWithEmail > 0) {
      console.log(`\n⚠️  Warning: ${docsWithEmail} document(s) still have email field`);
    } else {
      console.log('\n✅ All email fields removed successfully');
    }

    console.log('\n✅ Email field removal completed!');
  } catch (error: any) {
    console.error('\n❌ Error removing email field:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  removeEmailField().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { removeEmailField };
