
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { Project } from '../../../../lib/models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' }, 
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Project GET API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const project = await Project.findByIdAndUpdate(
      id, 
      { ...body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error: any) {
    console.error('Project PUT API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Project DELETE API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' }, 
      { status: 500 }
    );
  }
}
