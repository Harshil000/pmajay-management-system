import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { State } from '../../../../lib/models';

export async function POST() {
  try {
    await dbConnect();
    
    // Check if we have any states
    const stateCount = await State.countDocuments();
    
    if (stateCount === 0) {
      // Create some basic states for testing
      const sampleStates = [
        { name: 'Maharashtra', code: 'MH' },
        { name: 'Karnataka', code: 'KA' },
        { name: 'Tamil Nadu', code: 'TN' },
        { name: 'Gujarat', code: 'GJ' },
        { name: 'Uttar Pradesh', code: 'UP' },
        { name: 'West Bengal', code: 'WB' },
        { name: 'Delhi', code: 'DL' }
      ];
      
      const created = await State.insertMany(sampleStates);
      
      return NextResponse.json({
        success: true,
        message: `Created ${created.length} sample states`,
        data: created
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `Found ${stateCount} existing states`,
        count: stateCount
      });
    }
    
  } catch (error) {
    console.error('States seed error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed states',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}