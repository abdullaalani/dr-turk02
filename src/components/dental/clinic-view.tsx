'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useAppStore, ToothProcedure, Procedure, Appointment, Payment, LabExpense, PatientImage } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import DentalChart from './dental-chart';
import {
  Stethoscope, Plus, Trash2, DollarSign, CreditCard, AlertTriangle,
  Upload, FileImage, User, Calendar, Phone,
  ChevronDown, Search, Smile, CheckCircle2, Circle, StickyNote, FlaskConical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', SYP: 'ل.س' };
function fmtPrice(amount: number, currency?: string): string {
  const sym = CURRENCY_SYMBOLS[currency || 'USD'] || '$';
  return `${sym}${amount.toFixed(2)}`;
}

export default function ClinicView() {
  const { patients, appointments, procedures, discounts, selectedPatientId, setSelectedPatientId, fetchPatients } = useAppStore();
  const { toast } = useToast();

  // Derive selected patient from store — no local state, no useEffect
  const selectedPatient = selectedPatientId
    ? patients.find(p => p.id === selectedPatientId) ?? null
    : null;

  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [toothType, setToothType] = useState<'permanent' | 'temporary'>('permanent');
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [customToothName, setCustomToothName] = useState('');
  const [showCustomTooth, setShowCustomTooth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProcedure, setIsAddingProcedure] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lab expense state
  const [showLabExpenseDialog, setShowLabExpenseDialog] = useState(false);
  const [labExpenseDesc, setLabExpenseDesc] = useState('');
  const [labExpenseAmount, setLabExpenseAmount] = useState('');

  // Patient delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Procedure notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  const refreshPatient = useCallback(async () => {
    if (!selectedPatientId) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatientId}`);
      if (res.ok) {
        const freshData = await res.json();
        await fetchPatients();
        const store = useAppStore.getState();
        const updatedPatients = store.patients.map(p =>
          p.id === selectedPatientId ? freshData : p
        );
        useAppStore.setState({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Refresh patient error:', error);
    }
  }, [selectedPatientId, fetchPatients]);

  // Get scheduled patients from appointments — sorted by closest upcoming appointment
  const todayStr = new Date().toISOString().split('T')[0];
  const scheduledPatients = useMemo(() => {
    const seen = new Set<string>();
    return appointments
      .filter(a => (a.status === 'scheduled' || a.status === 'in-progress') && !seen.has(a.patientId) && seen.add(a.patientId))
      .sort((a, b) => {
      // Sort by date first, then by time
      if (a.date !== b.date) {
        // Appointments today or future come first
        const aFuture = a.date >= todayStr ? 0 : 1;
        const bFuture = b.date >= todayStr ? 0 : 1;
        if (aFuture !== bFuture) return aFuture - bFuture;
        return a.date.localeCompare(b.date);
      }
        return a.time.localeCompare(b.time);
      });
  }, [appointments, todayStr]);

  // Sort all patients by closest upcoming appointment
  const patientNextAppointment: Record<string, { date: string; time: string } | null> = {};
  patients.forEach(p => {
    const upcomingApts = appointments
      .filter(a => a.patientId === p.id && (a.status === 'scheduled' || a.status === 'in-progress') && a.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    patientNextAppointment[p.id] = upcomingApts.length > 0 ? { date: upcomingApts[0].date, time: upcomingApts[0].time } : null;
  });

  const filteredPatients = patients
    .filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.telephone.includes(searchQuery)
    )
    .sort((a, b) => {
      // Patients with upcoming appointments come first, sorted by closest
      const aNext = patientNextAppointment[a.id];
      const bNext = patientNextAppointment[b.id];
      if (aNext && !bNext) return -1;
      if (!aNext && bNext) return 1;
      if (aNext && bNext) {
        if (aNext.date !== bNext.date) return aNext.date.localeCompare(bNext.date);
        return aNext.time.localeCompare(bNext.time);
      }
      // Both without appointments — sort by name
      return a.name.localeCompare(b.name);
    });

  // Calculate totals grouped by currency
  const feeByCurrency: Record<string, number> = {};
  selectedPatient?.procedures?.forEach(tp => {
    const curr = tp.procedure.currency || 'USD';
    feeByCurrency[curr] = (feeByCurrency[curr] || 0) + tp.procedure.price;
  });
  const labByCurrency: Record<string, number> = {};
  selectedPatient?.labExpenses?.forEach(e => {
    // Try to infer currency from linked procedure; default to USD
    const tp = selectedPatient?.procedures?.find(tp =>
      tp.notes?.includes(e.description)
    );
    const curr = tp?.procedure?.currency || 'USD';
    labByCurrency[curr] = (labByCurrency[curr] || 0) + e.amount;
  });
  // For backward compat, also compute a single-currency total (assumes primary is USD for now)
  const totalFee = selectedPatient?.procedures?.reduce((sum, tp) => sum + tp.procedure.price, 0) || 0;
  const totalPaid = selectedPatient?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalLabExpenses = selectedPatient?.labExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const remainder = totalFee - totalPaid;

  // Active discount
  const now = useMemo(() => new Date().toISOString().split('T')[0], []);
  const activeDiscount = discounts.find(d => d.active && d.startDate <= now && d.endDate >= now);
  const discountedTotal = activeDiscount ? totalFee * (1 - activeDiscount.percentage / 100) : totalFee;
  const discountedRemainder = Math.max(0, discountedTotal - totalPaid);

  // Teeth with procedures map
  const teethWithProcedures: Record<string, { procedures: string[] }> = {};
  selectedPatient?.procedures?.forEach((tp) => {
    if (!teethWithProcedures[tp.toothNumber]) {
      teethWithProcedures[tp.toothNumber] = { procedures: [] };
    }
    teethWithProcedures[tp.toothNumber].procedures.push(tp.procedure.name);
  });

  // Handle tooth selection
  const handleToothSelect = (toothNumber: string) => {
    setSelectedTeeth(prev =>
      prev.includes(toothNumber)
        ? prev.filter(t => t !== toothNumber)
        : [...prev, toothNumber]
    );
  };

  // Add procedure for selected teeth
  const handleAddProcedure = async () => {
    if (!selectedPatient) {
      toast({ title: 'Error', description: 'Select a patient first', variant: 'destructive' });
      return;
    }
    if (selectedTeeth.length === 0 && !showCustomTooth) {
      toast({ title: 'Error', description: 'Select at least one tooth or add a custom tooth', variant: 'destructive' });
      return;
    }
    if (!selectedProcedureId) {
      toast({ title: 'Error', description: 'Select a procedure', variant: 'destructive' });
      return;
    }

    setIsAddingProcedure(true);
    try {
      const teethToAdd = showCustomTooth && customToothName
        ? [customToothName]
        : selectedTeeth;

      // Find the selected procedure to check for lab cost
      const selectedProc = procedures.find(p => p.id === selectedProcedureId);

      const failedTeeth: string[] = [];
      for (const tooth of teethToAdd) {
        const tpRes = await fetch('/api/tooth-procedures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            toothNumber: tooth,
            toothType,
            customToothName: showCustomTooth ? customToothName : undefined,
            procedureId: selectedProcedureId,
          }),
        });
        if (!tpRes.ok) {
          failedTeeth.push(tooth);
          continue;
        }

        // Auto-create lab expense if the procedure has a lab cost
        if (selectedProc && (selectedProc.labCost || 0) > 0) {
          const labRes = await fetch('/api/lab-expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: selectedPatient.id,
              description: `Lab: ${selectedProc.name} (Tooth #${tooth})`,
              amount: selectedProc.labCost,
              date: new Date().toISOString().split('T')[0],
            }),
          });
          if (!labRes.ok) {
            console.error('Failed to create lab expense for tooth', tooth);
          }
        }
      }
      if (failedTeeth.length > 0) {
        toast({ title: 'Warning', description: `Failed to add procedure for teeth: ${failedTeeth.join(', ')}`, variant: 'destructive' });
      }

      setSelectedTeeth([]);
      setCustomToothName('');
      setShowCustomTooth(false);
      setSelectedProcedureId('');
      await refreshPatient();
      toast({ title: 'Success', description: 'Procedure(s) added successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add procedure', variant: 'destructive' });
    }
    setIsAddingProcedure(false);
  };

  // Delete procedure
  const handleDeleteProcedure = async (id: string) => {
    try {
      const res = await fetch(`/api/tooth-procedures/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshPatient();
        toast({ title: 'Success', description: 'Procedure removed' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to remove procedure', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove procedure', variant: 'destructive' });
    }
  };

  // Toggle procedure completed
  const handleToggleCompleted = async (tp: ToothProcedure) => {
    try {
      const res = await fetch(`/api/tooth-procedures/${tp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !tp.completed }),
      });
      if (res.ok) {
        await refreshPatient();
        toast({ title: 'Success', description: tp.completed ? 'Procedure marked as pending' : 'Procedure marked as completed' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to update procedure status', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update procedure status', variant: 'destructive' });
    }
  };

  // Save procedure notes
  const handleSaveNotes = async (tpId: string) => {
    try {
      const res = await fetch(`/api/tooth-procedures/${tpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editingNotesText }),
      });
      if (res.ok) {
        setEditingNotesId(null);
        await refreshPatient();
        toast({ title: 'Success', description: 'Notes saved' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to save notes', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save notes', variant: 'destructive' });
    }
  };

  // Add payment
  const handleAddPayment = async () => {
    if (!selectedPatient || !paymentAmount) return;
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid positive amount', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          amount: parsedAmount,
          date: new Date().toISOString().split('T')[0],
          method: paymentMethod,
          note: paymentNote,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to record payment', variant: 'destructive' });
        return;
      }
      setPaymentAmount('');
      setPaymentNote('');
      setShowPaymentDialog(false);
      await refreshPatient();
      toast({ title: 'Success', description: 'Payment recorded' });
    } catch {
      toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' });
    }
  };

  // Delete payment
  const handleDeletePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshPatient();
        toast({ title: 'Success', description: 'Payment deleted' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to delete payment', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete payment', variant: 'destructive' });
    }
  };

  // Add lab expense
  const handleAddLabExpense = async () => {
    if (!selectedPatient || !labExpenseDesc || !labExpenseAmount) return;
    const parsedAmount = parseFloat(labExpenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid positive amount', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/lab-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          description: labExpenseDesc,
          amount: parsedAmount,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to add lab expense', variant: 'destructive' });
        return;
      }
      setLabExpenseDesc('');
      setLabExpenseAmount('');
      setShowLabExpenseDialog(false);
      await refreshPatient();
      toast({ title: 'Success', description: 'Lab expense added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add lab expense', variant: 'destructive' });
    }
  };

  // Delete lab expense
  const handleDeleteLabExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/lab-expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshPatient();
        toast({ title: 'Success', description: 'Lab expense deleted' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to delete lab expense', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete lab expense', variant: 'destructive' });
    }
  };

  // Delete patient (soft delete with confirmation)
  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Success', description: `${selectedPatient.name} has been removed` });
        setSelectedPatientId(null);
        await fetchPatients();
        setShowDeleteDialog(false);
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to delete patient', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete patient', variant: 'destructive' });
    }
    setIsDeleting(false);
  };

  // Image upload
  const handleImageUpload = async (file: File) => {
    if (!selectedPatient) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', selectedPatient.id);
    formData.append('imageType', 'panoramic');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        await refreshPatient();
        toast({ title: 'Success', description: 'Image uploaded' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to upload image', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Group procedures by category
  const proceduresByCategory = useMemo(() => procedures.reduce((acc, proc) => {
    if (!acc[proc.category]) acc[proc.category] = [];
    acc[proc.category].push(proc);
    return acc;
  }, {} as Record<string, Procedure[]>), [procedures]);

  // If no patient selected, show patient selection
  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dental Clinic</h2>
          <p className="text-gray-500 text-sm mt-1">Select a patient to begin treatment</p>
        </div>

        {scheduledPatients.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Scheduled Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledPatients.map((apt: Appointment) => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedPatientId(apt.patientId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{apt.patient?.name}</p>
                      <p className="text-xs text-gray-500">{apt.date} at {apt.time} &bull; {apt.patient?.telephone}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{apt.status}</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-500" />
              All Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">
                      {patient.gender} &bull; DOB: {patient.dateOfBirth} &bull; {patient.telephone}
                      {patientNextAppointment[patient.id] && (
                        <span className="text-emerald-600 ml-1">&bull; Next: {patientNextAppointment[patient.id]!.date} at {patientNextAppointment[patient.id]!.time}</span>
                      )}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No patients found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Patient file view
  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPatientId(null)} className="text-gray-500">
            &larr; Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{selectedPatient.gender}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />DOB: {selectedPatient.dateOfBirth}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedPatient.telephone}</span>
            </div>
          </div>
        </div>
        {remainder > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-bold text-red-600">Balance Due: {fmtPrice(remainder)}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-600 hover:bg-red-50 gap-1"
          onClick={() => setShowDeleteDialog(true)}
          title="Remove patient"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Remove</span>
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Fee</p>
            <p className="text-xl font-bold text-gray-900">{fmtPrice(totalFee)}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-emerald-600 mb-1">Paid</p>
            <p className="text-xl font-bold text-emerald-700">{fmtPrice(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className={remainder > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}>
          <CardContent className="p-4 text-center">
            <p className={remainder > 0 ? "text-xs text-red-600 mb-1" : "text-xs text-gray-500 mb-1"}>Remainder</p>
            <p className={remainder > 0 ? "text-xl font-bold text-red-600" : "text-xl font-bold text-gray-900"}>{fmtPrice(remainder)}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-purple-600 mb-1">Lab Expenses</p>
            <p className="text-xl font-bold text-purple-700">{fmtPrice(totalLabExpenses)}</p>
          </CardContent>
        </Card>
        <Card className={activeDiscount ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-amber-600 mb-1">
              {activeDiscount ? `With ${activeDiscount.percentage}% Discount` : 'After Discount'}
            </p>
            <p className={activeDiscount ? "text-xl font-bold text-amber-700" : "text-xl font-bold text-gray-900"}>
              {fmtPrice(discountedRemainder)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-blue-600 mb-1">Net Profit</p>
            <p className="text-xl font-bold text-blue-700">{fmtPrice(totalPaid - totalLabExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="procedures" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="procedures" className="gap-1">
            <Stethoscope className="w-4 h-4" /> Procedures
          </TabsTrigger>
          <TabsTrigger value="chart" className="gap-1">
            <Smile className="w-4 h-4" /> Tooth Chart
          </TabsTrigger>
          <TabsTrigger value="lab" className="gap-1">
            <FlaskConical className="w-4 h-4" /> Lab
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1">
            <FileImage className="w-4 h-4" /> Images
          </TabsTrigger>
        </TabsList>

        {/* Procedures Tab */}
        <TabsContent value="procedures" className="space-y-4 mt-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Add Procedure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm">Tooth Type:</Label>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setToothType('permanent')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toothType === 'permanent' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}
                  >
                    Permanent
                  </button>
                  <button
                    onClick={() => setToothType('temporary')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toothType === 'temporary' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}
                  >
                    Temporary
                  </button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCustomTooth(!showCustomTooth)} className="ml-auto gap-1">
                  <Plus className="w-3 h-3" /> Custom Tooth
                </Button>
              </div>

              {showCustomTooth && (
                <div className="space-y-2">
                  <Label>Custom Tooth Name/Number</Label>
                  <Input
                    value={customToothName}
                    onChange={(e) => setCustomToothName(e.target.value)}
                    placeholder="e.g., Implant #1, Supernumerary, etc."
                  />
                </div>
              )}

              {!showCustomTooth && (
                <div className="border rounded-lg p-3 bg-gray-50/50">
                  <p className="text-xs text-gray-500 mb-2">Click teeth to select (selected: {selectedTeeth.length})</p>
                  <DentalChart
                    toothType={toothType}
                    selectedTeeth={selectedTeeth}
                    onToothSelect={handleToothSelect}
                    teethWithProcedures={teethWithProcedures}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Procedure</Label>
                <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select procedure..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Object.entries(proceduresByCategory).map(([category, procs]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 sticky top-0">{category}</div>
                        {procs.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.name} &mdash; ${proc.price.toFixed(2)}
                            {(proc.labCost || 0) > 0 && <span className="text-purple-500 ml-1">(Lab: ${proc.labCost.toFixed(2)})</span>}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost breakdown for selected procedure */}
              {selectedProcedureId && (() => {
                const selProc = procedures.find(p => p.id === selectedProcedureId);
                if (!selProc) return null;
                const labC = selProc.labCost || 0;
                const profit = selProc.price - labC;
                return (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-2">{selProc.name} — Cost Breakdown</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-gray-400">Price</p>
                        <p className="text-sm font-bold text-gray-900">${selProc.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-500">Lab Cost</p>
                        <p className={`text-sm font-bold ${labC > 0 ? 'text-purple-600' : 'text-gray-400'}`}>${labC.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500">Profit</p>
                        <p className="text-sm font-bold text-emerald-600">${profit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <Button
                onClick={handleAddProcedure}
                disabled={isAddingProcedure || (!selectedTeeth.length && !showCustomTooth) || !selectedProcedureId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                {isAddingProcedure ? 'Adding...' : 'Add Procedure'}
              </Button>
            </CardContent>
          </Card>

          {/* Procedures list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Patient Procedures</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatient.procedures?.length > 0 ? (
                <div className="space-y-2">
                  {selectedPatient.procedures.map((tp: ToothProcedure) => (
                    <div
                      key={tp.id}
                      className={`p-3 rounded-lg border transition-all ${
                        tp.completed
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Completion toggle */}
                          <button
                            onClick={() => handleToggleCompleted(tp)}
                            className="flex-shrink-0 transition-colors"
                            title={tp.completed ? 'Mark as pending' : 'Mark as completed'}
                          >
                            {tp.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-emerald-500" />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                            {tp.toothNumber}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${tp.completed ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                              {tp.procedure.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Tooth #{tp.toothNumber}
                              {tp.customToothName && ` (${tp.customToothName})`}
                              {' \u2022 '}{tp.toothType === 'temporary' ? 'Temporary' : 'Permanent'}
                              {tp.completed && ' \u2022 Completed'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={`font-semibold text-sm ${tp.completed ? 'text-emerald-600' : 'text-gray-900'}`}>
                              ${tp.procedure.price.toFixed(2)}
                            </span>
                            {(tp.procedure.labCost || 0) > 0 && (
                              <p className="text-[10px] text-purple-500">Lab: ${tp.procedure.labCost.toFixed(2)}</p>
                            )}
                          </div>
                          {/* Notes button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 ${tp.notes ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                            onClick={() => {
                              setEditingNotesId(editingNotesId === tp.id ? null : tp.id);
                              setEditingNotesText(tp.notes || '');
                            }}
                            title={tp.notes ? `Notes: ${tp.notes}` : 'Add notes'}
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={() => handleDeleteProcedure(tp.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Notes section - expandable */}
                      {editingNotesId === tp.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          <Label className="text-xs text-gray-500">Treatment Notes</Label>
                          <Textarea
                            value={editingNotesText}
                            onChange={(e) => setEditingNotesText(e.target.value)}
                            placeholder="Add notes about treatment progress, observations, next steps..."
                            className="text-sm min-h-[60px]"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNotesId(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(tp.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Show existing notes (collapsed) */}
                      {tp.notes && editingNotesId !== tp.id && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 flex items-start gap-1">
                            <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                            <span className="italic">{tp.notes}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center px-1">
                    <span className="font-medium text-gray-700">Total</span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">${totalFee.toFixed(2)}</span>
                      {activeDiscount && (
                        <p className="text-xs text-amber-600">After {activeDiscount.percentage}% discount: ${discountedTotal.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No procedures yet. Add one above.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Payments
                </CardTitle>
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" size="sm">
                      <DollarSign className="w-4 h-4" /> Pay
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between">
                          <span>Total Fee:</span>
                          <span className="font-semibold">${totalFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Already Paid:</span>
                          <span className="font-semibold text-emerald-600">${totalPaid.toFixed(2)}</span>
                        </div>
                        {activeDiscount && (
                          <div className="flex justify-between text-amber-600">
                            <span>After {activeDiscount.percentage}% Discount:</span>
                            <span className="font-semibold">${discountedRemainder.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-red-600 font-bold">
                          <span>Remaining:</span>
                          <span>${remainder.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter payment amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Credit/Debit Card</SelectItem>
                            <SelectItem value="transfer">Bank Transfer</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="Payment note"
                        />
                      </div>
                      <Button onClick={handleAddPayment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        Record Payment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPatient.payments?.length > 0 ? (
                <div className="space-y-2">
                  {selectedPatient.payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-700 text-sm">${payment.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{payment.date} &bull; {payment.method}{payment.note ? ` &bull; ${payment.note}` : ''}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={() => handleDeletePayment(payment.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No payments recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tooth Chart Tab */}
        <TabsContent value="chart" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dental Chart</CardTitle>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setToothType('permanent')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toothType === 'permanent' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}
                  >
                    Permanent
                  </button>
                  <button
                    onClick={() => setToothType('temporary')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toothType === 'temporary' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}
                  >
                    Temporary
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DentalChart
                toothType={toothType}
                selectedTeeth={selectedTeeth}
                onToothSelect={handleToothSelect}
                teethWithProcedures={teethWithProcedures}
              />

              {Object.keys(teethWithProcedures).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Procedures by Tooth</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(teethWithProcedures).map(([tooth, data]) => (
                      <div key={tooth} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0">
                          {tooth}
                        </div>
                        <div>
                          {data.procedures.map((proc: string, i: number) => (
                            <p key={i} className="text-xs text-gray-700">{proc}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Expenses Tab */}
        <TabsContent value="lab" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  Laboratory Expenses
                </CardTitle>
                <Dialog open={showLabExpenseDialog} onOpenChange={setShowLabExpenseDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2" size="sm">
                      <Plus className="w-4 h-4" /> Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Lab Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={labExpenseDesc}
                          onChange={(e) => setLabExpenseDesc(e.target.value)}
                          placeholder="e.g., Crown fabrication, denture mold, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={labExpenseAmount}
                          onChange={(e) => setLabExpenseAmount(e.target.value)}
                          placeholder="Enter expense amount"
                        />
                      </div>
                      <Button onClick={handleAddLabExpense} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Add Lab Expense
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPatient.labExpenses?.length > 0 ? (
                <div className="space-y-2">
                  {selectedPatient.labExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <FlaskConical className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-700 text-sm">${expense.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{expense.description} &bull; {expense.date}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={() => handleDeleteLabExpense(expense.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center px-1">
                    <span className="font-medium text-gray-700">Total Lab Expenses</span>
                    <span className="font-bold text-purple-700">${totalLabExpenses.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No lab expenses recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileImage className="w-5 h-5 text-emerald-600" />
                Panoramic Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-emerald-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 font-medium">
                  {isDragOver ? 'Drop image here' : 'Drag & drop panoramic image here'}
                </p>
                <p className="text-xs text-gray-400 mt-1">or click to browse from your laptop</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {selectedPatient.images?.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPatient.images.map((img: any) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={img.imagePath}
                        alt="Panoramic X-ray"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white">{img.imageType} &bull; {img.createdAt.split('T')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Remove Patient
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">Are you sure you want to remove <strong>{selectedPatient.name}</strong>?</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Procedures:</span>
                    <span className="font-medium">{selectedPatient.procedures?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Appointments:</span>
                    <span className="font-medium">{selectedPatient.appointments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payments:</span>
                    <span className="font-medium">{selectedPatient.payments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lab Expenses:</span>
                    <span className="font-medium">{selectedPatient.labExpenses?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Images:</span>
                    <span className="font-medium">{selectedPatient.images?.length || 0}</span>
                  </div>
                </div>
                {remainder > 0 && (
                  <p className="text-red-600 font-medium text-sm">
                    Warning: This patient has an outstanding balance of ${remainder.toFixed(2)}.
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">The patient will be soft-deleted and hidden from the list. Data is preserved.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Removing...' : 'Remove Patient'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
