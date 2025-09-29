import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { Communication } from '../../../lib/models';

export async function GET() {
  try {
    await dbConnect();
    const communications = await Communication.find({})
      .populate('fromAgency', 'name type')
      .populate('toAgency', 'name type')
      .populate('ccAgencies', 'name type')
      .populate('projectId', 'name component')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: communications,
      count: communications.length
    });
  } catch (error) {
    console.error('Communications API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.subject || !body.message || !body.fromAgency || !body.toAgency || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Subject, message, from agency, to agency, and type are required' },
        { status: 400 }
      );
    }
    
    const communication = new Communication({
      ...body,
      status: 'Sent',
      updatedAt: new Date()
    });
    await communication.save();
    
    // Populate the saved communication
    await communication.populate([
      { path: 'fromAgency', select: 'name type' },
      { path: 'toAgency', select: 'name type' },
      { path: 'projectId', select: 'name component' }
    ]);
    
    return NextResponse.json({
      success: true,
      data: communication,
      message: 'Communication sent successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Communications POST API Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to send communication' },
      { status: 500 }
    );
  }
}