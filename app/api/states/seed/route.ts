import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { State } from '../../../../lib/models';
import { INDIAN_STATES_DATA } from '../../../../lib/indianStatesData';

export async function POST() {
  try {
    await dbConnect();
    
    // Always clear existing states for fresh population
    await State.deleteMany({});
    
    // Transform Indian states data to match our schema
    const statesData = INDIAN_STATES_DATA.map(state => ({
      name: state.name,
      code: state.code,
      population: state.population * 100000, // Convert from lakhs to actual number
      type: state.type,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert all Indian states and UTs
    const created = await State.insertMany(statesData);
    
    return NextResponse.json({
      success: true,
      message: `Successfully populated ${created.length} Indian states and union territories`,
      data: {
        total: created.length,
        states: statesData.filter(s => s.type === 'state').length,
        unionTerritories: statesData.filter(s => s.type === 'ut').length,
        details: created
      }
    });
    
  } catch (error) {
    console.error('States seed error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to auto-populate states',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    const stateCount = await State.countDocuments();
    const availableStatesCount = INDIAN_STATES_DATA.length;
    
    return NextResponse.json({
      success: true,
      message: 'States seed status',
      data: {
        existingStates: stateCount,
        availableStates: availableStatesCount,
        canSeed: true,
        statesData: INDIAN_STATES_DATA
      }
    });
    
  } catch (error) {
    console.error('States seed status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get seed status'
    }, { status: 500 });
  }
}