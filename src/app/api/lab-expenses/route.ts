import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const date = searchParams.get('date');
    
    if (patientId) {
      const expenses = await db.labExpense.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(expenses);
    }
    
    if (date) {
      const expenses = await db.labExpense.findMany({
        where: { date },
        include: { patient: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(expenses);
    }
    
    const expenses = await db.labExpense.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Get lab expenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch lab expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, description, amount, date } = body;

    if (!patientId || !description || !amount || !date) {
      return NextResponse.json({ error: 'Patient, description, amount, and date are required' }, { status: 400 });
    }

    const expense = await db.labExpense.create({
      data: {
        patientId,
        description,
        amount: parseFloat(amount),
        date,
      },
      include: { patient: true },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Create lab expense error:', error);
    return NextResponse.json({ error: 'Failed to create lab expense' }, { status: 500 });
  }
}
