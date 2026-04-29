'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore, Patient, Appointment } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, User,
  Calendar, Trash2, Stethoscope, Search, Timer, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOLIDAY_INDEX = 6; // Friday is a holiday
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 AM to 7:00 PM
const SLOT_HEIGHT = 30; // px per 30-min slot
const DURATION_OPTIONS = [30, 60, 90, 120]; // minutes

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

function formatHourMin(hour: number, min: number): string {
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${min.toString().padStart(2, '0')} ${ampm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // We want Saturday (6) as the start of the week
  // If current day is Saturday (6), diff = 0; if Sunday (0), diff = -1; if Monday (1), diff = -2; etc.
  const diff = day === 6 ? 0 : -(day + 1);
  const saturday = new Date(referenceDate);
  saturday.setDate(referenceDate.getDate() + diff);
  saturday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    return d;
  });
}

function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isToday(d: Date): boolean {
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export default function WeeklySchedule() {
  const {
    patients, appointments, addAppointment, fetchAppointments,
    removeAppointment, updateAppointment, setActiveTab, setSelectedPatientId
  } = useAppStore();
  const { toast } = useToast();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekDates(new Date())[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientDOB, setNewPatientDOB] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    conflicts: Array<{ id: string; time: string; duration: number; patientId: string }>;
    pendingData: { patientId: string; date: string; time: string; duration: number; notes: string } | null;
  }>({ open: false, conflicts: [], pendingData: null });

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Group appointments by date
  const appointmentsMap = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(apt => {
      const key = apt.date;
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    return map;
  }, [appointments]);

  // Build a set of "occupied" slots per day (slots covered by multi-slot appointments)
  const occupiedSlots = useMemo(() => {
    const occupied: Record<string, Set<string>> = {};
    appointments.forEach(apt => {
      const key = apt.date;
      if (!occupied[key]) occupied[key] = new Set();
      const startMins = timeToMinutes(apt.time);
      const duration = apt.duration || 30;
      for (let m = startMins; m < startMins + duration; m += 30) {
        // Only mark as occupied if it's NOT the starting slot (starting slot shows the appointment bar)
        if (m !== startMins) {
          occupied[key].add(minutesToTime(m));
        }
      }
    });
    return occupied;
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 10);
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.telephone.includes(q)
    ).slice(0, 10);
  }, [patientSearch, patients]);

  const goToPrevWeek = useCallback(() => {
    setCurrentWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(getWeekDates(new Date())[0]);
  }, []);

  const handleSlotClick = (date: string, time: string, isHoliday: boolean) => {
    // Don't open dialog on holidays
    if (isHoliday) return;
    // Don't open dialog on slots occupied by a multi-slot appointment continuation
    const dayOccupied = occupiedSlots[date];
    if (dayOccupied && dayOccupied.has(time)) return;
    setSelectedSlot({ date, time });
    setSelectedDuration(30);
    setDialogOpen(true);
    setPatientSearch('');
    setSelectedPatient(null);
    setIsNewPatient(false);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientDOB('');
    setNewPatientGender('');
    setAppointmentNotes('');
    setShowSuggestions(false);
  };

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setDetailDialogOpen(true);
  };

  const handleSelectExistingPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setShowSuggestions(false);
    setIsNewPatient(false);
  };

  const handleCreateNewPatientAndAppointment = async () => {
    if (!newPatientName || !newPatientPhone || !newPatientDOB || !newPatientGender) {
      toast({ title: 'Error', description: 'All patient fields are required', variant: 'destructive' });
      return;
    }
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      const patientRes = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPatientName, dateOfBirth: newPatientDOB, gender: newPatientGender, telephone: newPatientPhone }),
      });
      if (!patientRes.ok) { const err = await patientRes.json(); toast({ title: 'Error', description: err.error, variant: 'destructive' }); setIsSubmitting(false); return; }
      const patient = await patientRes.json();
      const aptRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, date: selectedSlot.date, time: selectedSlot.time, duration: selectedDuration, notes: appointmentNotes }),
      });
      if (aptRes.ok) {
        const apt = await aptRes.json();
        addAppointment(apt);
        await useAppStore.getState().fetchPatients();
        toast({ title: 'Success', description: `Appointment created for ${patient.name}` });
        setDialogOpen(false);
      }
    } catch { toast({ title: 'Error', description: 'Failed to create appointment', variant: 'destructive' }); }
    setIsSubmitting(false);
  };

  const handleCreateAppointment = async (override = false) => {
    if (!selectedPatient || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient.id, date: selectedSlot.date, time: selectedSlot.time, duration: selectedDuration, notes: appointmentNotes }),
      });
      if (res.status === 409) {
        // Conflict detected — show warning dialog
        const conflictData = await res.json();
        if (override) {
          // Force book: update the conflicting appointment's status to cancelled, then create new one
          for (const conflict of conflictData.conflicts || []) {
            await fetch(`/api/appointments/${conflict.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'cancelled' }),
            });
          }
          const retryRes = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: selectedPatient.id, date: selectedSlot.date, time: selectedSlot.time, duration: selectedDuration, notes: appointmentNotes }),
          });
          if (retryRes.ok) {
            const apt = await retryRes.json();
            addAppointment(apt);
            await useAppStore.getState().fetchAppointments();
            toast({ title: 'Success', description: `Appointment created for ${selectedPatient.name}` });
            setDialogOpen(false);
            setConflictDialog({ open: false, conflicts: [], pendingData: null });
          }
        } else {
          setConflictDialog({
            open: true,
            conflicts: conflictData.conflicts || [],
            pendingData: { patientId: selectedPatient.id, date: selectedSlot.date, time: selectedSlot.time, duration: selectedDuration, notes: appointmentNotes },
          });
        }
      } else if (res.ok) {
        const apt = await res.json();
        addAppointment(apt);
        toast({ title: 'Success', description: `Appointment created for ${selectedPatient.name}` });
        setDialogOpen(false);
      }
    } catch { toast({ title: 'Error', description: 'Failed to create appointment', variant: 'destructive' }); }
    setIsSubmitting(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) { removeAppointment(id); setDetailDialogOpen(false); toast({ title: 'Success', description: 'Appointment deleted' }); }
    } catch { toast({ title: 'Error', description: 'Failed to delete appointment', variant: 'destructive' }); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { const updated = await res.json(); updateAppointment(updated); setSelectedAppointment(updated); toast({ title: 'Success', description: `Status updated to ${status}` }); }
    } catch { toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' }); }
  };

  const handleGoToPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('clinic');
    setDetailDialogOpen(false);
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    'in-progress': 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const appointmentBarColors: Record<string, string> = {
    scheduled: 'bg-blue-500',
    'in-progress': 'bg-amber-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-400',
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const sm = start.toLocaleDateString('en-US', { month: 'short' });
    const em = end.toLocaleDateString('en-US', { month: 'short' });
    const y = end.getFullYear();
    return sm === em ? `${sm} ${start.getDate()} - ${end.getDate()}, ${y}` : `${sm} ${start.getDate()} - ${em} ${end.getDate()}, ${y}`;
  }, [weekDates]);

  // Calculate end time for a slot + duration
  const getEndTime = (time: string, duration: number): string => {
    const mins = timeToMinutes(time) + duration;
    return formatHourMin(Math.floor(mins / 60), mins % 60);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Weekly Schedule
          </h2>
          <p className="text-gray-500 text-sm mt-1">Click any time slot to add an appointment</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevWeek} className="gap-1"><ChevronLeft className="w-4 h-4" /> Prev</Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Week label */}
      <div className="text-center">
        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-1.5 rounded-full">{weekLabel}</span>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b-2 border-gray-300 bg-gray-50">
              <div className="p-2 text-xs font-medium text-gray-400 text-center border-r border-gray-200">Time</div>
              {weekDates.map((d, i) => {
                const isHoliday = i === HOLIDAY_INDEX;
                return (
                <div key={i} className={`p-2 text-center border-r border-gray-200 last:border-r-0 ${isHoliday ? 'bg-red-50' : isToday(d) ? 'bg-emerald-50' : ''}`}>
                  <p className={`text-[10px] font-medium uppercase tracking-wider ${isHoliday ? 'text-red-400' : 'text-gray-400'}`}>{DAYS[i].slice(0, 3)}</p>
                  <p className={`text-lg font-bold ${isHoliday ? 'text-red-400' : isToday(d) ? 'text-emerald-600' : 'text-gray-800'}`}>{d.getDate()}</p>
                  {isHoliday && <p className="text-[8px] font-semibold text-red-400 uppercase">Holiday</p>}
                </div>
              );})}
            </div>

            {/* Time Slots — 30 minute intervals */}
            <div className="relative">
              {HOURS.map((hour, hourIdx) => ([0, 30] as const).map(minute => {
                const isHalf = minute === 30;
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Thick line between hours (above :00 slots), thin line between :00 and :30
                const borderClass = isHalf
                  ? 'border-b border-gray-200'  // thin solid line between :00 and :30 within same hour
                  : hourIdx === 0
                    ? '' // no top border on first hour
                    : 'border-t-2 border-gray-300'; // thick line above the :00 of each new hour

                return (
                  <div key={`${hour}-${minute}`} className={`grid grid-cols-[80px_repeat(7,1fr)] ${borderClass}`}>
                    {/* Time label column */}
                    <div className={`text-[10px] font-medium text-center border-r border-gray-200 flex items-center justify-center h-[30px] ${isHalf ? 'text-gray-300' : 'text-gray-500'}`}>
                      {isHalf ? formatHourMin(hour, minute) : formatHour(hour)}
                    </div>
                    {/* Day cells */}
                    {weekDates.map((d, dayIndex) => {
                      const dateStr = dateToStr(d);
                      const isHoliday = dayIndex === HOLIDAY_INDEX;
                      const dayApts = appointmentsMap[dateStr] || [];
                      const dayOccupied = occupiedSlots[dateStr];
                      const isOccupied = dayOccupied && dayOccupied.has(timeStr);

                      // Find appointment starting at this slot
                      const startApts = dayApts.filter(apt => apt.time === timeStr);

                      // Find appointment that starts earlier but overlaps into this slot (for rendering continuation)
                      const continuingApts = dayApts.filter(apt => {
                        const startMins = timeToMinutes(apt.time);
                        const endMins = startMins + (apt.duration || 30);
                        const thisMins = timeToMinutes(timeStr);
                        return thisMins > startMins && thisMins < endMins;
                      });

                      // If this is a holiday (Friday), render blocked cell
                      if (isHoliday) {
                        return (
                          <div
                            key={dayIndex}
                            className="h-[30px] border-r border-gray-100 last:border-r-0 relative bg-red-50/40 cursor-not-allowed"
                          >
                            {!isHalf && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[9px] font-medium text-red-300">Off</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // If this slot is occupied by a continuing appointment, render as filled
                      if (isOccupied && startApts.length === 0) {
                        return (
                          <div
                            key={dayIndex}
                            className={`h-[30px] border-r border-gray-100 last:border-r-0 relative ${
                              isToday(d) ? 'bg-emerald-50/30' : ''
                            }`}
                          />
                        );
                      }

                      return (
                        <div
                          key={dayIndex}
                          className={`h-[30px] border-r border-gray-100 last:border-r-0 relative cursor-pointer transition-colors group ${
                            isToday(d) ? 'bg-emerald-50/30 hover:bg-emerald-100/50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSlotClick(dateStr, timeStr, false)}
                        >
                          {/* Hover time indicator */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[9px] font-medium text-emerald-500 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                              {formatHourMin(hour, minute)}
                            </span>
                          </div>

                          {/* Appointment bars starting at this slot */}
                          {startApts.map(apt => {
                            const duration = apt.duration || 30;
                            const slotsSpan = Math.ceil(duration / 30);
                            const barHeight = slotsSpan * SLOT_HEIGHT - 4; // -4 for padding
                            return (
                              <div
                                key={apt.id}
                                className={`absolute left-1 right-1 top-0.5 rounded-md px-2 py-0.5 text-white text-[10px] cursor-pointer shadow-sm z-10 hover:shadow-md transition-shadow overflow-hidden ${
                                  appointmentBarColors[apt.status] || 'bg-blue-500'
                                }`}
                                style={{ height: `${barHeight}px` }}
                                onClick={(e) => handleAppointmentClick(apt, e)}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold truncate leading-tight">{apt.patient?.name || 'Unknown'}</span>
                                </div>
                                {duration > 30 && (
                                  <div className="flex items-center gap-0.5 opacity-80 mt-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span className="text-[8px]">{formatHourMin(parseInt(apt.time.split(':')[0]), parseInt(apt.time.split(':')[1] || '0'))} - {getEndTime(apt.time, duration)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-gray-500">Status:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Scheduled</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> In Progress</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" /> Cancelled</span>
      </div>

      {/* Add Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Add Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Selected slot info */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {selectedSlot && (() => {
                    const d = new Date(selectedSlot.date + 'T00:00:00');
                    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                    // Map to DAYS array index: Sat=0, Sun=1, Mon=2, ..., Fri=6
                    const dayIndex = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
                    const dayName = DAYS[dayIndex];
                    return `${dayName}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                  })()}
                </span>
                <span className="text-emerald-600">
                  {selectedSlot && formatHourMin(parseInt(selectedSlot.time.split(':')[0]), parseInt(selectedSlot.time.split(':')[1] || '0'))}
                  {' — '}
                  {selectedSlot && getEndTime(selectedSlot.time, selectedDuration)}
                </span>
              </div>
            </div>

            {/* Duration selector */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-gray-500" />
                Duration
              </Label>
              <div className="flex gap-1.5">
                {DURATION_OPTIONS.map(dur => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedDuration === dur
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {dur} min
                  </button>
                ))}
              </div>
              {selectedDuration > 30 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Extended session: {selectedSlot && formatHourMin(parseInt(selectedSlot.time.split(':')[0]), parseInt(selectedSlot.time.split(':')[1] || '0'))} — {selectedSlot && getEndTime(selectedSlot.time, selectedDuration)}
                </p>
              )}
            </div>

            {/* Patient selection */}
            <div className="space-y-2" ref={searchRef}>
              <Label className="text-sm font-medium">Patient</Label>
              {!isNewPatient ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search patient by name or phone..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setShowSuggestions(true); setSelectedPatient(null); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10"
                  />
                  {showSuggestions && !selectedPatient && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredPatients.map(p => (
                        <button key={p.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 transition-colors text-left" onClick={() => handleSelectExistingPatient(p)}>
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-gray-500" /></div>
                          <div className="min-w-0"><p className="font-medium text-gray-900 text-sm truncate">{p.name}</p><p className="text-xs text-gray-400">{p.gender} &bull; {p.telephone}</p></div>
                        </button>
                      ))}
                      {filteredPatients.length === 0 && <div className="px-3 py-4 text-center text-sm text-gray-400">No patients found</div>}
                      <div className="border-t border-gray-100">
                        <button className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-emerald-50 transition-colors text-emerald-600 text-sm font-medium" onClick={() => setIsNewPatient(true)}>
                          <Plus className="w-4 h-4" /> Add new patient
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedPatient && (
                    <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center"><User className="w-3.5 h-3.5 text-emerald-700" /></div>
                      <div className="flex-1 min-w-0"><p className="font-medium text-emerald-800 text-sm">{selectedPatient.name}</p><p className="text-xs text-emerald-600">{selectedPatient.telephone}</p></div>
                      <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-700">New Patient</p>
                    <button onClick={() => setIsNewPatient(false)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1"><Label className="text-xs">Full Name</Label><Input value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Patient name" /></div>
                    <div className="space-y-1"><Label className="text-xs">Date of Birth</Label><Input type="date" value={newPatientDOB} onChange={e => setNewPatientDOB(e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">Gender</Label><select value={newPatientGender} onChange={e => setNewPatientGender(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div className="col-span-2 space-y-1"><Label className="text-xs">Telephone</Label><Input type="tel" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} placeholder="Phone number" /></div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-sm">Notes (Optional)</Label>
              <Input value={appointmentNotes} onChange={e => setAppointmentNotes(e.target.value)} placeholder="Appointment notes..." />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              {isNewPatient ? (
                <Button onClick={handleCreateNewPatientAndAppointment} disabled={isSubmitting || !newPatientName} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? 'Creating...' : 'Create Patient & Appointment'}
                </Button>
              ) : (
                <Button onClick={() => handleCreateAppointment()} disabled={isSubmitting || !selectedPatient} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? 'Creating...' : `Book ${selectedDuration} min Appointment`}
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><User className="w-6 h-6 text-emerald-600" /></div>
                <div>
                  <button onClick={() => handleGoToPatient(selectedAppointment.patientId)} className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">{selectedAppointment.patient?.name || 'Unknown Patient'}</button>
                  <p className="text-xs text-gray-500">{selectedAppointment.patient?.telephone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-500 mb-1">Date</p>
                  <p className="font-semibold text-blue-700 text-sm">{selectedAppointment.date}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-500 mb-1">Time</p>
                  <p className="font-semibold text-blue-700 text-sm">{formatHourMin(parseInt(selectedAppointment.time.split(':')[0]), parseInt(selectedAppointment.time.split(':')[1] || '0'))}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-500 mb-1">Duration</p>
                  <p className="font-semibold text-purple-700 text-sm">{selectedAppointment.duration || 30} min</p>
                  {(selectedAppointment.duration || 30) > 30 && (
                    <p className="text-[10px] text-purple-400 mt-0.5">
                      until {getEndTime(selectedAppointment.time, selectedAppointment.duration || 30)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge className={`${statusColors[selectedAppointment.status] || ''} text-xs`}>{selectedAppointment.status}</Badge>
              </div>
              {selectedAppointment.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedAppointment.status === 'scheduled' && (
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-1" onClick={() => handleUpdateStatus(selectedAppointment.id, 'in-progress')}>
                    <Stethoscope className="w-3.5 h-3.5" /> Start
                  </Button>
                )}
                {selectedAppointment.status === 'in-progress' && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}>
                    Completed
                  </Button>
                )}
                {selectedAppointment.status === 'scheduled' && (
                  <Button size="sm" variant="outline" className="text-red-500 gap-1" onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}>
                    Cancel
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1" onClick={() => handleGoToPatient(selectedAppointment.patientId)}>
                  <User className="w-3.5 h-3.5" /> Patient File
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 gap-1 ml-auto" onClick={() => handleDeleteAppointment(selectedAppointment.id)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflict Warning Dialog */}
      {conflictDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Scheduling Conflict</h3>
                <p className="text-sm text-gray-500">This time slot overlaps with existing appointments</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {conflictDialog.conflicts.map((c) => {
                const conflictPatient = patients.find(p => p.id === c.patientId);
                const conflictEndMins = timeToMinutes(c.time) + (c.duration || 30);
                return (
                  <div key={c.id} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-amber-800">
                      {conflictPatient?.name || 'Unknown'} &mdash; {c.time} ({c.duration} min)
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              You can book anyway (existing appointments will be cancelled) or choose a different time.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCreateAppointment(true)}
                disabled={isSubmitting}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                {isSubmitting ? 'Booking...' : 'Book Anyway'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConflictDialog({ open: false, conflicts: [], pendingData: null })}
              >
                Choose Different Time
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
