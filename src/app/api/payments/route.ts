import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const date = searchParams.get('date');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    if (patientId) {
      const payments = await db.payment.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(payments);
    }
    
    if (date) {
      const payments = await db.payment.findMany({
        where: { date },
        include: { patient: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(payments);
    }
    
    // If pagination params are provided, return paginated response
    if (pageParam && limitParam) {
      const page = parseInt(pageParam, 10) || 1;
      const limit = parseInt(limitParam, 10) || 20;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        db.payment.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { patient: true },
        }),
        db.payment.count(),
      ]);

      return NextResponse.json({
        data: payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Backward compat: return plain array if no pagination params
    const payments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createPaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { patientId, amount, date, method, note } = result.data;

    const payment = await db.payment.create({
      data: {
        patientId,
        amount,
        date,
        method,
        note,
      },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
