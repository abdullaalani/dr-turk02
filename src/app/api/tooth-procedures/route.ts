import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createToothProcedureSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const date = searchParams.get('date');
    
    if (patientId) {
      const procedures = await db.toothProcedure.findMany({
        where: { patientId },
        include: { procedure: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(procedures);
    }
    
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      const procedures = await db.toothProcedure.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { procedure: true, patient: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(procedures);
    }
    
    const procedures = await db.toothProcedure.findMany({
      include: { procedure: true, patient: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Get tooth procedures error:', error);
    return NextResponse.json({ error: 'Failed to fetch tooth procedures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createToothProcedureSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { patientId, toothNumber, toothType, customToothName, procedureId } = result.data;

    const toothProcedure = await db.toothProcedure.create({
      data: {
        patientId,
        toothNumber,
        toothType,
        customToothName,
        procedureId,
      },
      include: { procedure: true, patient: true },
    });
    return NextResponse.json(toothProcedure, { status: 201 });
  } catch (error) {
    console.error('Create tooth procedure error:', error);
    return NextResponse.json({ error: 'Failed to create tooth procedure' }, { status: 500 });
  }
}
