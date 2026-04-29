import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const defaultProcedures = [
  // Diagnostic
  { name: 'Oral Examination', category: 'Diagnostic', price: 50, labCost: 0 },
  { name: 'Dental X-Ray (Periapical)', category: 'Diagnostic', price: 30, labCost: 5 },
  { name: 'Panoramic X-Ray', category: 'Diagnostic', price: 80, labCost: 15 },
  { name: 'Cephalometric X-Ray', category: 'Diagnostic', price: 90, labCost: 15 },
  // Preventive
  { name: 'Dental Cleaning (Prophylaxis)', category: 'Preventive', price: 100, labCost: 0 },
  { name: 'Fluoride Treatment', category: 'Preventive', price: 40, labCost: 5 },
  { name: 'Dental Sealant (per tooth)', category: 'Preventive', price: 45, labCost: 10 },
  { name: 'Space Maintainer', category: 'Preventive', price: 150, labCost: 40 },
  // Restorative
  { name: 'Composite Filling (Anterior)', category: 'Restorative', price: 120, labCost: 15 },
  { name: 'Composite Filling (Posterior)', category: 'Restorative', price: 150, labCost: 20 },
  { name: 'Amalgam Filling', category: 'Restorative', price: 100, labCost: 15 },
  { name: 'Glass Ionomer Filling', category: 'Restorative', price: 90, labCost: 10 },
  { name: 'Inlay/Onlay (Composite)', category: 'Restorative', price: 350, labCost: 80 },
  { name: 'Inlay/Onlay (Porcelain)', category: 'Restorative', price: 500, labCost: 150 },
  // Endodontics
  { name: 'Pulpotomy', category: 'Endodontics', price: 200, labCost: 10 },
  { name: 'Root Canal (Anterior)', category: 'Endodontics', price: 350, labCost: 20 },
  { name: 'Root Canal (Premolar)', category: 'Endodontics', price: 450, labCost: 25 },
  { name: 'Root Canal (Molar)', category: 'Endodontics', price: 550, labCost: 30 },
  { name: 'Retreatment Root Canal', category: 'Endodontics', price: 600, labCost: 30 },
  // Periodontics
  { name: 'Scaling and Root Planing (per quadrant)', category: 'Periodontics', price: 200, labCost: 0 },
  { name: 'Gingivectomy', category: 'Periodontics', price: 250, labCost: 0 },
  { name: 'Periodontal Surgery', category: 'Periodontics', price: 800, labCost: 50 },
  { name: 'Bone Graft (Periodontal)', category: 'Periodontics', price: 600, labCost: 200 },
  // Prosthodontics
  { name: 'Porcelain Crown', category: 'Prosthodontics', price: 600, labCost: 100 },
  { name: 'Zirconia Crown', category: 'Prosthodontics', price: 700, labCost: 120 },
  { name: 'Metal Crown', category: 'Prosthodontics', price: 400, labCost: 60 },
  { name: 'Porcelain Bridge (per unit)', category: 'Prosthodontics', price: 650, labCost: 110 },
  { name: 'Removable Partial Denture', category: 'Prosthodontics', price: 800, labCost: 200 },
  { name: 'Complete Denture', category: 'Prosthodontics', price: 1200, labCost: 300 },
  { name: 'Veneer (Porcelain)', category: 'Prosthodontics', price: 700, labCost: 120 },
  { name: 'Veneer (Composite)', category: 'Prosthodontics', price: 400, labCost: 30 },
  // Oral Surgery
  { name: 'Simple Extraction', category: 'Oral Surgery', price: 100, labCost: 0 },
  { name: 'Surgical Extraction', category: 'Oral Surgery', price: 200, labCost: 0 },
  { name: 'Wisdom Tooth Extraction', category: 'Oral Surgery', price: 350, labCost: 0 },
  { name: 'Implant Placement', category: 'Oral Surgery', price: 1500, labCost: 400 },
  { name: 'Bone Graft (Surgical)', category: 'Oral Surgery', price: 500, labCost: 150 },
  { name: 'Sinus Lift', category: 'Oral Surgery', price: 1200, labCost: 200 },
  // Orthodontics
  { name: 'Metal Braces (Full)', category: 'Orthodontics', price: 3000, labCost: 500 },
  { name: 'Ceramic Braces (Full)', category: 'Orthodontics', price: 4000, labCost: 700 },
  { name: 'Clear Aligners', category: 'Orthodontics', price: 3500, labCost: 600 },
  { name: 'Retainer', category: 'Orthodontics', price: 300, labCost: 50 },
  // Pediatric
  { name: 'Stainless Steel Crown', category: 'Pediatric', price: 200, labCost: 30 },
  { name: 'Strip Crown', category: 'Pediatric', price: 180, labCost: 20 },
  { name: 'Pulpotomy (Primary)', category: 'Pediatric', price: 150, labCost: 10 },
  { name: 'Space Maintainer (Fixed)', category: 'Pediatric', price: 200, labCost: 40 },
  { name: 'Space Maintainer (Removable)', category: 'Pediatric', price: 250, labCost: 50 },
];

export async function POST() {
  try {
    const existing = await db.procedure.count();
    if (existing > 0) {
      return NextResponse.json({ message: 'Procedures already seeded', count: existing });
    }
    const procedures = await db.procedure.createMany({
      data: defaultProcedures,
    });

    // Seed default admin user if none exists
    const existingUsers = await db.user.count();
    if (existingUsers === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      await db.user.create({
        data: {
          name: 'Admin',
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
        },
      });
    }

    return NextResponse.json({ message: 'Procedures seeded successfully', count: procedures.count });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed procedures' }, { status: 500 });
  }
}
