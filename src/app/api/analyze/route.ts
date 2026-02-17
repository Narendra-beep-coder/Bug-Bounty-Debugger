import { NextRequest, NextResponse } from 'next/server';
import { analyzeCode } from '@/lib/analyzers';
import { getDatabase } from '@/lib/mongodb';
import { AnalyzeRequest, Analysis } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    
    const { code, language } = body;
    
    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }
    
    // Analyze the code
    const { bugs, summary } = analyzeCode(code, language);
    
    // Try to save to MongoDB, but don't fail if it's unavailable
    const db = await getDatabase();
    if (db) {
      try {
        const analysis: Omit<Analysis, '_id'> = {
          code,
          language,
          bugs,
          summary,
          createdAt: new Date(),
        };
        
        const result = await db.collection.insertOne(analysis as Analysis);
        
        return NextResponse.json({
          id: result.insertedId,
          bugs,
          summary,
        });
      } catch (dbError) {
        // If MongoDB insert fails, still return analysis results
        console.warn('MongoDB insert failed, returning results without saving:', dbError);
        return NextResponse.json({
          bugs,
          summary,
          warning: 'Results not saved to database',
        });
      }
    } else {
      // MongoDB not available
      return NextResponse.json({
        bugs,
        summary,
        warning: 'Database not available. Results not saved.',
      });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze code' },
      { status: 500 }
    );
  }
}
