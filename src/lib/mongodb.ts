import { MongoClient, Db, Collection } from 'mongodb';
import { Analysis } from './types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bughunter';
const COLLECTION_NAME = 'analyses';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionError: Error | null = null;
let isConnecting = false;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db; collection: Collection<Analysis> } | null> {
  // Return cached error if MongoDB was previously unavailable
  if (connectionError) {
    console.warn('MongoDB previously failed to connect, skipping retry:', connectionError.message);
    return null;
  }

  // Return existing connection if available
  if (client && db) {
    return { client, db, collection: db.collection<Analysis>(COLLECTION_NAME) };
  }

  // Prevent multiple concurrent connection attempts
  if (isConnecting) {
    return null;
  }

  isConnecting = true;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create index on createdAt for sorting
    await db.collection<Analysis>(COLLECTION_NAME).createIndex({ createdAt: -1 });
    
    console.log('Connected to MongoDB');
    isConnecting = false;
    return { client, db, collection: db.collection<Analysis>(COLLECTION_NAME) };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    connectionError = error as Error;
    isConnecting = false;
    return null;
  }
}

export async function getDatabase(): Promise<{ client: MongoClient; db: Db; collection: Collection<Analysis> } | null> {
  return connectToDatabase();
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connectionError = null;
    console.log('MongoDB connection closed');
  }
}

export function isDatabaseAvailable(): boolean {
  return connectionError === null && client !== null;
}
