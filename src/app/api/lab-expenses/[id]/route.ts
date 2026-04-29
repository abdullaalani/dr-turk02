import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.labExpense.delete({ where: { id } });
    return NextResponse.json({ message: 'Lab expense deleted' });
  } catch (error) {
    console.error('Delete lab expense error:', error);
    return NextResponse.json({ error: 'Failed to delete lab expense' }, { status: 500 });
  }
}
