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
    
    // Save to MongoDB
    try {
      const { collection } = await getDatabase();
      
      const analysis: Omit<Analysis, '_id'> = {
        code,
        language,
        bugs,
        summary,
        createdAt: new Date(),
      };
      
      const result = await collection.insertOne(analysis as Analysis);
      
      return NextResponse.json({
        id: result.insertedId,
        bugs,
        summary,
      });
    } catch (dbError) {
      // If MongoDB is not available, still return analysis results
      console.warn('MongoDB not available, returning results without saving:', dbError);
      return NextResponse.json({
        bugs,
        summary,
        warning: 'Results not saved to database',
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
