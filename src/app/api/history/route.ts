import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Analysis } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { collection } = await getDatabase();
    
    // Get the last 50 analyses, sorted by date descending
    const analyses = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .project({ code: 0 }) // Exclude code to reduce payload size
      .toArray();
    
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', analyses: [] },
      { status: 500 }
    );
  }
}
