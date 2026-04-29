import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { percentage, startDate, endDate, active } = body;

    if (!percentage || !startDate || !endDate) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const discount = await db.discountSetting.create({
      data: {
        percentage: parseFloat(percentage),
        startDate,
        endDate,
        active: active !== undefined ? active : true,
      },
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Create discount error:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
