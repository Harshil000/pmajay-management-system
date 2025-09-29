
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { State } from '../../../../lib/models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const state = await State.findById(id);
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State not found' }, 
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: state
    });
  } catch (error: any) {
    console.error('State GET API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch state' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const state = await State.findByIdAndUpdate(
      id, 
      { ...body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: state,
      message: 'State updated successfully'
    });
  } catch (error: any) {
    console.error('State PUT API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update state' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const state = await State.findByIdAndDelete(id);
    
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'State deleted successfully'
    });
  } catch (error: any) {
    console.error('State DELETE API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete state' }, 
      { status: 500 }
    );
  }
}
