import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const image = await db.patientImage.findUnique({ where: { id } });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', image.imagePath);
      await unlink(filePath);
    } catch {
      // File may already be deleted, continue with DB deletion
    }

    await db.patientImage.delete({ where: { id } });
    return NextResponse.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
