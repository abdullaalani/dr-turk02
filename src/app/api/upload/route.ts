import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadSchema = z.object({
  patientId: z.string().min(1),
  imageType: z.enum(['panoramic', 'periapical', 'bitewing', 'intraoral', 'other']).optional().default('panoramic'),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string | null;
    const imageType = formData.get('imageType') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Validate patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId, deletedAt: null } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size: 5MB' }, { status: 400 });
    }

    // Validate image type
    const validated = uploadSchema.safeParse({ patientId, imageType: imageType || 'panoramic' });
    const finalImageType = validated.success ? validated.data.imageType : 'panoramic';

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', patientId);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const relativePath = `/uploads/${patientId}/${filename}`;

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    // Create database record
    const image = await db.patientImage.create({
      data: {
        patientId,
        imagePath: relativePath,
        imageType: finalImageType,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
