import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    const { name, category, price } = body;
    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    const procedure = await db.procedure.create({
      data: { name, category, price: parseFloat(price) },
    });
    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    console.error('Create procedure error:', error);
    return NextResponse.json({ error: 'Failed to create procedure' }, { status: 500 });
  }
}
