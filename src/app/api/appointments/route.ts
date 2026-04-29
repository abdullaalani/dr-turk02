import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createAppointmentSchema } from '@/lib/validations';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // If pagination params are provided, return paginated response
    if (pageParam && limitParam) {
      const page = parseInt(pageParam, 10) || 1;
      const limit = parseInt(limitParam, 10) || 20;
      const skip = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        db.appointment.findMany({
          orderBy: { date: 'desc' },
          skip,
          take: limit,
          include: { patient: true },
        }),
        db.appointment.count(),
      ]);

      return NextResponse.json({
        data: appointments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Backward compat: return plain array if no pagination params
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
    const forceCreate = body.forceCreate === true;
    const result = createAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = result.data;

    // Check for time conflicts
    const newStart = timeToMinutes(data.time);
    const newEnd = newStart + (data.duration || 30);

    const existingAppointments = await db.appointment.findMany({
      where: { date: data.date, status: { in: ['scheduled', 'in-progress'] } },
    });

    const conflicts = existingAppointments.filter(apt => {
      const aptStart = timeToMinutes(apt.time);
      const aptEnd = aptStart + (apt.duration || 30);
      return newStart < aptEnd && newEnd > aptStart; // overlap check
    });

    if (conflicts.length > 0) {
      // If forceCreate is true, skip conflict check
      if (!forceCreate) {
        return NextResponse.json(
          {
            error: 'Time conflict',
            conflicts: conflicts.map(a => ({
              id: a.id,
              time: a.time,
              duration: a.duration,
              patientId: a.patientId,
            })),
          },
          { status: 409 }
        );
      }
    }

    const appointment = await db.appointment.create({
      data: {
        patientId: data.patientId,
        date: data.date,
        time: data.time,
        duration: data.duration,
        status: data.status,
        notes: data.notes,
      },
      include: { patient: true },
    });
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
