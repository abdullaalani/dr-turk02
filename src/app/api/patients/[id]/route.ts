import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        procedures: { include: { procedure: true }, orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        appointments: { orderBy: { date: 'desc' } },
        images: true,
        labExpenses: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const patient = await db.patient.update({
      where: { id },
      data: body,
      include: {
        procedures: { include: { procedure: true } },
        payments: true,
        appointments: true,
        images: true,
        labExpenses: true,
      },
    });
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.patient.delete({ where: { id } });
    return NextResponse.json({ message: 'Patient deleted' });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
