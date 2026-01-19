/**
 * Database Utility Functions
 * Helper functions for MongoDB operations
 */

import mongoose from 'mongoose';
import connectDB from './mongodb';

/**
 * Rebuild all indexes for a specific model
 */
export async function rebuildIndexes(modelName: string) {
  await connectDB();
  
  const model = mongoose.models[modelName];
  if (!model) {
    throw new Error(`Model ${modelName} not found`);
  }
  
  // Drop all indexes except _id
  const collection = model.collection;
  const indexes = await collection.indexes();
  
  for (const index of indexes) {
    if (index.name && index.name !== '_id_') {
      try {
        await collection.dropIndex(index.name);
      } catch (error: any) {
        // Ignore if index doesn't exist
        if (error.code !== 27) {
          console.warn(`Could not drop index ${index.name}:`, error.message);
        }
      }
    }
  }
  
  // Recreate indexes
  await model.createIndexes();
  
  return await collection.indexes();
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  await connectDB();
  
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  
  const collections = await db.listCollections().toArray();
  const stats: any = {
    collections: collections.length,
    details: {},
  };
  
  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    const indexes = await db.collection(collection.name).indexes();
    
    stats.details[collection.name] = {
      documents: count,
      indexes: indexes.length,
      indexNames: indexes.map(idx => idx.name),
    };
  }
  
  return stats;
}

/**
 * Update documents with default values for new fields
 */
export async function updateDocumentsWithDefaults(
  modelName: string,
  defaults: Record<string, any>
) {
  await connectDB();
  
  const model = mongoose.models[modelName];
  if (!model) {
    throw new Error(`Model ${modelName} not found`);
  }
  
  const updateQuery: any = {};
  for (const field in defaults) {
    updateQuery[field] = { $exists: false };
  }
  
  const result = await model.updateMany(
    updateQuery,
    { $set: defaults }
  );
  
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  };
}
