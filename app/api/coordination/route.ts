import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { CoordinationMatrix } from '../../../lib/models';

export async function GET() {
  try {
    await dbConnect();
    const matrices = await CoordinationMatrix.find({ isActive: true })
      .populate({
        path: 'agencies.agency',
        select: 'name type level'
      })
      .populate({
        path: 'slaMatrix.fromAgency',
        select: 'name type'
      })
      .populate({
        path: 'slaMatrix.toAgency',
        select: 'name type'
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: matrices,
      count: matrices.length
    });
  } catch (error) {
    console.error('Coordination Matrix API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coordination matrices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.state || !body.component || !body.level) {
      return NextResponse.json(
        { success: false, error: 'Name, state, component, and level are required' },
        { status: 400 }
      );
    }
    
    const matrix = new CoordinationMatrix({
      ...body,
      isActive: true,
      updatedAt: new Date()
    });
    await matrix.save();
    
    return NextResponse.json({
      success: true,
      data: matrix,
      message: 'Coordination matrix created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Coordination Matrix POST API Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create coordination matrix' },
      { status: 500 }
    );
  }
}