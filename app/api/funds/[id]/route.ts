
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { FundFlow } from '../../../../lib/models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const fund = await FundFlow.findById(id);
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' }, 
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: fund
    });
  } catch (error: any) {
    console.error('Fund GET API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fund' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const fund = await FundFlow.findByIdAndUpdate(
      id, 
      { ...body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: fund,
      message: 'Fund updated successfully'
    });
  } catch (error: any) {
    console.error('Fund PUT API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fund' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const fund = await FundFlow.findByIdAndDelete(id);
    
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Fund deleted successfully'
    });
  } catch (error: any) {
    console.error('Fund DELETE API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete fund' }, 
      { status: 500 }
    );
  }
}
