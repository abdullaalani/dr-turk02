import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const patients = await db.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        procedures: { include: { procedure: true } },
        payments: true,
        appointments: { orderBy: { date: 'desc' } },
        images: true,
        labExpenses: true,
      },
    });
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dateOfBirth, gender, telephone } = body;

    if (!name || !dateOfBirth || !gender || !telephone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const patient = await db.patient.create({
      data: { name, dateOfBirth, gender, telephone },
      include: {
        procedures: { include: { procedure: true } },
        payments: true,
        appointments: true,
        images: true,
        labExpenses: true,
      },
    });
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
