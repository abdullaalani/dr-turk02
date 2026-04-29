import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const date = searchParams.get('date');
    
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
    const { patientId, amount, date, method, note } = body;

    if (!patientId || !amount || !date) {
      return NextResponse.json({ error: 'Patient, amount, and date are required' }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        patientId,
        amount: parseFloat(amount),
        date,
        method: method || 'cash',
        note,
      },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
