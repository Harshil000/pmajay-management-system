
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { Agency } from '../../../lib/models';

export async function GET() {
  try {
    await dbConnect();
    const agencies = await Agency.find({}).sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      data: agencies,
      count: agencies.length
    });
  } catch (error) {
    console.error('Agencies API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agencies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    console.log('Received agency data:', body);
    
    // Validate required fields
    if (!body.name || !body.type || !body.level || !body.state || !body.code || !body.contactEmail || !body.contactPhone || !body.stateCode) {
      const missing = [];
      if (!body.name) missing.push('name');
      if (!body.code) missing.push('code');
      if (!body.type) missing.push('type');
      if (!body.level) missing.push('level');
      if (!body.state) missing.push('state');
      if (!body.stateCode) missing.push('stateCode');
      if (!body.contactEmail) missing.push('contactEmail');
      if (!body.contactPhone) missing.push('contactPhone');
      
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate enum values
    const validTypes = ['Implementing Agency', 'Executing Agency', 'Nodal Agency', 'Monitoring Agency'];
    const validLevels = ['Central', 'State', 'District', 'Block', 'Local'];
    
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid agency type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    if (!validLevels.includes(body.level)) {
      return NextResponse.json(
        { success: false, error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }
    
    const agency = new Agency({
      ...body,
      updatedAt: new Date()
    });
    await agency.save();
    
    return NextResponse.json({
      success: true,
      data: agency,
      message: 'Agency created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Agencies POST API Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create agency' },
      { status: 500 }
    );
  }
}
