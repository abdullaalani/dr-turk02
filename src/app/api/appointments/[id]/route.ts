import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentSchema } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const appointment = await db.appointment.update({
      where: { id },
      data: result.data,
      include: { patient: true },
    });
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.appointment.delete({ where: { id } });
    return NextResponse.json({ message: 'Appointment deleted' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
