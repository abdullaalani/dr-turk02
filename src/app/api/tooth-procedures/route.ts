import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    const { patientId, toothNumber, toothType, customToothName, procedureId } = body;

    if (!patientId || !toothNumber || !procedureId) {
      return NextResponse.json({ error: 'Patient, tooth number, and procedure are required' }, { status: 400 });
    }

    const toothProcedure = await db.toothProcedure.create({
      data: {
        patientId,
        toothNumber,
        toothType: toothType || 'permanent',
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
