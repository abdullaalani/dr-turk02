import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createProcedureSchema } from '@/lib/validations';

export async function GET() {
  try {
    const procedures = await db.procedure.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Get procedures error:', error);
    return NextResponse.json({ error: 'Failed to fetch procedures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createProcedureSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, category, price, labCost, currency } = result.data;

    const procedure = await db.procedure.create({
      data: { name, category, price, labCost, currency },
    });
    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    console.error('Create procedure error:', error);
    return NextResponse.json({ error: 'Failed to create procedure' }, { status: 500 });
  }
}
