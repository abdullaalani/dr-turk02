import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { updateDiscountSchema } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateDiscountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const discount = await db.discountSetting.update({
      where: { id },
      data: result.data,
    });
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Update discount error:', error);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.discountSetting.delete({ where: { id } });
    return NextResponse.json({ message: 'Discount deleted' });
  } catch (error) {
    console.error('Delete discount error:', error);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}
