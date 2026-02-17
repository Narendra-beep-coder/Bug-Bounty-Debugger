import { MongoClient, Db, Collection } from 'mongodb';
import { Analysis } from './types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bughunter';
const COLLECTION_NAME = 'analyses';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db; collection: Collection<Analysis> }> {
  if (client && db) {
    return { client, db, collection: db.collection<Analysis>(COLLECTION_NAME) };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create index on createdAt for sorting
    await db.collection<Analysis>(COLLECTION_NAME).createIndex({ createdAt: -1 });
    
    console.log('Connected to MongoDB');
    return { client, db, collection: db.collection<Analysis>(COLLECTION_NAME) };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<{ client: MongoClient; db: Db; collection: Collection<Analysis> }> {
  return connectToDatabase();
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}
