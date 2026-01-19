/**
 * MongoDB Update Utility Script
 * 
 * This script helps update MongoDB:
 * 1. Rebuild indexes (remove duplicates and recreate)
 * 2. Update existing documents with new fields
 * 3. Migrate data structure
 * 
 * Usage:
 *   npx ts-node scripts/update-mongodb.ts
 *   or
 *   npm run update-db
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import User from '../models/User';

async function updateIndexes() {
  console.log('🔄 Updating MongoDB indexes...');
  
  try {
    // Get all collections
    const collections = mongoose.connection.collections;
    
    for (const collectionName in collections) {
      const collection = collections[collectionName];
      console.log(`\n📋 Processing collection: ${collectionName}`);
      
      try {
        // Get current indexes
        const indexes = await collection.indexes();
        console.log(`   Found ${indexes.length} indexes`);
        
        // Drop all indexes except _id
        for (const index of indexes) {
          if (index.name && index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
              console.log(`   ✅ Dropped index: ${index.name}`);
            } catch (error: any) {
              if (error.code !== 27) { // Index not found
                console.log(`   ⚠️  Could not drop index ${index.name}: ${error.message}`);
              }
            }
          }
        }
        
        // Recreate indexes from model
        if (collectionName === 'users') {
          await User.createIndexes();
          console.log('   ✅ Recreated User indexes');
        }
        
      } catch (error: any) {
        console.log(`   ❌ Error processing ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Index update completed!');
  } catch (error: any) {
    console.error('❌ Error updating indexes:', error);
    throw error;
  }
}

async function updateUserDocuments() {
  console.log('\n🔄 Updating User documents...');
  
  try {
    // Update all users that don't have policeRank field
    const result = await User.updateMany(
      { policeRank: { $exists: false } },
      { $set: { policeRank: null } }
    );
    
    console.log(`   ✅ Updated ${result.modifiedCount} user documents`);
    
    // Ensure all users have required fields
    const usersWithoutName = await User.countDocuments({ name: { $exists: false } });
    if (usersWithoutName > 0) {
      console.log(`   ⚠️  Found ${usersWithoutName} users without name field`);
    }
    
  } catch (error: any) {
    console.error('❌ Error updating user documents:', error);
    throw error;
  }
}

async function showDatabaseStats() {
  console.log('\n📊 Database Statistics:');
  
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log('   ❌ Database not connected');
      return;
    }
    
    const collections = await db.listCollections().toArray();
    console.log(`   Collections: ${collections.length}`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      const indexes = await db.collection(collection.name).indexes();
      console.log(`   - ${collection.name}: ${count} documents, ${indexes.length} indexes`);
    }
    
  } catch (error: any) {
    console.error('❌ Error getting database stats:', error);
  }
}

async function main() {
  console.log('🚀 Starting MongoDB Update...\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Show current stats
    await showDatabaseStats();
    
    // Update indexes
    await updateIndexes();
    
    // Update documents
    await updateUserDocuments();
    
    // Show final stats
    await showDatabaseStats();
    
    console.log('\n✅ MongoDB update completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { updateIndexes, updateUserDocuments, showDatabaseStats };
