import { z } from 'zod';

// Patient
export const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'male', 'female'], { message: 'Gender must be Male or Female' }),
  telephone: z.string().min(6, 'Phone must be at least 6 digits').max(20, 'Phone too long'),
});

export const updatePatientSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().min(1).optional(),
  gender: z.enum(['Male', 'Female', 'male', 'female']).optional(),
  telephone: z.string().min(6).max(20).optional(),
});

// Appointment
export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().min(1, 'Time is required').regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  duration: z.number().int().min(15).max(480).optional().default(30),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional().default('scheduled'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().int().min(15).max(480).optional(),
});

// Payment
export const createPaymentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  amount: z.number().positive('Amount must be greater than 0').max(999999, 'Amount too large'),
  date: z.string().min(1, 'Date is required'),
  method: z.enum(['cash', 'card', 'transfer', 'insurance']).optional().default('cash'),
  note: z.string().max(300, 'Note too long').optional(),
});

// Tooth Procedure
export const createToothProcedureSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  toothNumber: z.string().min(1, 'Tooth number is required'),
  toothType: z.enum(['permanent', 'temporary']).optional().default('permanent'),
  customToothName: z.string().max(100).optional(),
  procedureId: z.string().min(1, 'Procedure ID is required'),
});

export const updateToothProcedureSchema = z.object({
  completed: z.boolean().optional(),
  paid: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

// Procedure
export const createProcedureSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  category: z.string().min(1, 'Category is required'),
  price: z.number().nonnegative('Price must be 0 or more'),
  labCost: z.number().nonnegative().optional().default(0),
  currency: z.enum(['USD', 'SYP']).optional().default('USD'),
});

export const updateProcedureSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  labCost: z.number().nonnegative().optional(),
  currency: z.enum(['USD', 'SYP']).optional(),
});

// Lab Expense
export const createLabExpenseSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  description: z.string().min(1, 'Description is required').max(300),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
});

// Discount
export const createDiscountSchema = z.object({
  percentage: z.number().min(1, 'Minimum 1%').max(100, 'Maximum 100%'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  active: z.boolean().optional().default(true),
});

export const updateDiscountSchema = z.object({
  percentage: z.number().min(1).max(100).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

// Auth
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['admin', 'dentist', 'assistant']).optional().default('assistant'),
});

// Pagination helper
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
