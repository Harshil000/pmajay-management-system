
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import { FundFlow } from '../../../lib/models';

export async function GET() {
  try {
    await dbConnect();
    const funds = await FundFlow.find({})
      .populate('projectId', 'name')
      .populate('fromAgency', 'name')
      .populate('toAgency', 'name')
      .sort({ releaseDate: -1 });
    
    return NextResponse.json({
      success: true,
      data: funds,
      count: funds.length
    });
  } catch (error) {
    console.error('Fund Flows API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fund flows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    console.log('Received fund data:', body);
    
    // Validate required fields
    if (!body.projectId || !body.amount || !body.releaseDate || !body.component || !body.purpose || !body.fromAgency || !body.toAgency) {
      const missing = [];
      if (!body.projectId) missing.push('projectId');
      if (!body.amount) missing.push('amount');
      if (!body.releaseDate) missing.push('releaseDate');
      if (!body.component) missing.push('component');
      if (!body.purpose) missing.push('purpose');
      if (!body.fromAgency) missing.push('fromAgency');
      if (!body.toAgency) missing.push('toAgency');
      
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }
    
    const fund = new FundFlow({
      ...body,
      updatedAt: new Date()
    });
    await fund.save();
    
    return NextResponse.json({
      success: true,
      data: fund,
      message: 'Fund flow created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Fund Flows POST API Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create fund flow' },
      { status: 500 }
    );
  }
}
