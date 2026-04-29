import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const procedure = await db.procedure.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(procedure);
  } catch (error) {
    console.error('Update procedure error:', error);
    return NextResponse.json({ error: 'Failed to update procedure' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.procedure.delete({ where: { id } });
    return NextResponse.json({ message: 'Procedure deleted' });
  } catch (error) {
    console.error('Delete procedure error:', error);
    return NextResponse.json({ error: 'Failed to delete procedure' }, { status: 500 });
  }
}
