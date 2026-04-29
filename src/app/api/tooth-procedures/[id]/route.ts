import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { updateToothProcedureSchema } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateToothProcedureSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const toothProcedure = await db.toothProcedure.update({
      where: { id },
      data: result.data,
      include: { procedure: true },
    });
    return NextResponse.json(toothProcedure);
  } catch (error) {
    console.error('Update tooth procedure error:', error);
    return NextResponse.json({ error: 'Failed to update tooth procedure' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.toothProcedure.delete({ where: { id } });
    return NextResponse.json({ message: 'Tooth procedure deleted' });
  } catch (error) {
    console.error('Delete tooth procedure error:', error);
    return NextResponse.json({ error: 'Failed to delete tooth procedure' }, { status: 500 });
  }
}
