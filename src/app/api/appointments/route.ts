import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
      orderBy: { date: 'desc' },
      include: { patient: true },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, date, time, duration, status, notes } = body;

    if (!patientId || !date || !time) {
      return NextResponse.json({ error: 'Patient, date, and time are required' }, { status: 400 });
    }

    const appointment = await db.appointment.create({
      data: { patientId, date, time, duration: duration || 30, status: status || 'scheduled', notes },
      include: { patient: true },
    });
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
