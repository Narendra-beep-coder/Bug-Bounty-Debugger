import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Analysis } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // MongoDB not available
    if (!db) {
      return NextResponse.json({ analyses: [], warning: 'Database not available' });
    }
    
    // Get the last 50 analyses, sorted by date descending
    const analyses = await db.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .project({ code: 0 }) // Exclude code to reduce payload size
      .toArray();
    
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    // Return empty array if MongoDB is not available
    return NextResponse.json({ analyses: [], warning: 'Database not available' });
  }
}
