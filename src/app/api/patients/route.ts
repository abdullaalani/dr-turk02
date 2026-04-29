import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createPatientSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search');

    // Build where clause - always filter out soft-deleted patients
    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const includeRelations = {
      include: {
        procedures: { include: { procedure: true } },
        payments: true,
        appointments: { orderBy: { date: 'desc' as const } },
        images: true,
        labExpenses: true,
      },
    };

    // If pagination params are provided, return paginated response
    if (pageParam && limitParam) {
      const page = parseInt(pageParam, 10) || 1;
      const limit = parseInt(limitParam, 10) || 20;
      const skip = (page - 1) * limit;

      const [patients, total] = await Promise.all([
        db.patient.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          ...includeRelations,
        }),
        db.patient.count({ where }),
      ]);

      return NextResponse.json({
        data: patients,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Backward compat: return plain array if no pagination params
    const patients = await db.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...includeRelations,
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
    const result = createPatientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, dateOfBirth, gender, telephone } = result.data;

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
