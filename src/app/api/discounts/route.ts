import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createDiscountSchema } from '@/lib/validations';

export async function GET() {
  try {
    const discounts = await db.discountSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Get discounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createDiscountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { percentage, startDate, endDate, active } = result.data;

    const discount = await db.discountSetting.create({
      data: {
        percentage,
        startDate,
        endDate,
        active,
      },
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Create discount error:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
