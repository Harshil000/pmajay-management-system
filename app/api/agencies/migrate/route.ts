import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { Agency } from '../../../../lib/models';

export async function POST() {
  try {
    await dbConnect();
    
    // Find agencies with invalid or missing data
    const agencies = await Agency.find({});
    const updates = [];
    
    for (const agency of agencies) {
      const updateFields: any = {};
      let needsUpdate = false;
      
      // Fix missing code field
      if (!agency.code) {
        updateFields.code = agency.name.substring(0, 3).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();
        needsUpdate = true;
      }
      
      // Fix invalid type values
      if (!['Implementing Agency', 'Executing Agency', 'Nodal Agency', 'Monitoring Agency'].includes(agency.type)) {
        switch (agency.type) {
          case 'Central Ministry':
            updateFields.type = 'Nodal Agency';
            break;
          case 'State Department':
            updateFields.type = 'Implementing Agency';
            break;
          case 'Local Body':
            updateFields.type = 'Executing Agency';
            break;
          default:
            updateFields.type = 'Implementing Agency';
        }
        needsUpdate = true;
      }
      
      // Fix missing level field
      if (!agency.level) {
        if (agency.type === 'Central Ministry' || updateFields.type === 'Nodal Agency') {
          updateFields.level = 'Central';
        } else if (agency.type === 'State Department' || updateFields.type === 'Implementing Agency') {
          updateFields.level = 'State';
        } else {
          updateFields.level = 'Local';
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Agency.findByIdAndUpdate(agency._id, updateFields);
        updates.push({
          id: agency._id,
          name: agency.name,
          changes: updateFields
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} agencies`,
      updates: updates
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to migrate agencies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}