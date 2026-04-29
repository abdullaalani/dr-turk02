import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { updateProcedureSchema } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateProcedureSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const procedure = await db.procedure.update({
      where: { id },
      data: result.data,
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
    // Check if the procedure is referenced by any ToothProcedure
    const referenceCount = await db.toothProcedure.count({
      where: { procedureId: id },
    });
    if (referenceCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete procedure: it is referenced by tooth procedures', referenceCount },
        { status: 409 }
      );
    }
    await db.procedure.delete({ where: { id } });
    return NextResponse.json({ message: 'Procedure deleted' });
  } catch (error) {
    console.error('Delete procedure error:', error);
    return NextResponse.json({ error: 'Failed to delete procedure' }, { status: 500 });
  }
}
