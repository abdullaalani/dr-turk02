'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarPlus, UserPlus, Clock, Trash2, User, Phone, 
  Calendar, Stethoscope, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReceptionView() {
  const { patients, appointments, addPatient, addAppointment, fetchPatients, fetchAppointments, removeAppointment, updateAppointment, setActiveTab, setSelectedPatientId } = useAppStore();
  const { toast } = useToast();
  
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', dateOfBirth: '', gender: '', telephone: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', date: '', time: '', duration: 30, notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.dateOfBirth || !newPatient.gender || !newPatient.telephone) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        const patient = await res.json();
        addPatient(patient);
        setNewPatient({ name: '', dateOfBirth: '', gender: '', telephone: '' });
        setShowNewPatientForm(false);
        toast({ title: 'Success', description: 'Patient created successfully' });
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create patient', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.patientId || !appointmentForm.date || !appointmentForm.time) {
      toast({ title: 'Error', description: 'Patient, date, and time are required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentForm),
      });
      if (res.ok) {
        const appointment = await res.json();
        addAppointment(appointment);
        setAppointmentForm({ patientId: '', date: '', time: '', duration: 30, notes: '' });
        toast({ title: 'Success', description: 'Appointment scheduled successfully' });
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create appointment', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        removeAppointment(id);
        toast({ title: 'Success', description: 'Appointment deleted' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete appointment', variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateAppointment(updated);
        toast({ title: 'Success', description: `Appointment marked as ${status}` });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update appointment', variant: 'destructive' });
    }
  };

  const handleGoToPatientFile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('clinic');
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    'in-progress': 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const upcomingAppointments = appointments.filter(a => a.date > today);
  const pastAppointments = appointments.filter(a => a.date < today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reception Desk</h2>
          <p className="text-gray-500 text-sm mt-1">Manage patients and appointments</p>
        </div>
        <Button 
          onClick={() => setShowNewPatientForm(!showNewPatientForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <UserPlus className="w-4 h-4" />
          New Patient
        </Button>
      </div>

      {/* New Patient Form */}
      {showNewPatientForm && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Register New Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePatient} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="Patient full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={newPatient.gender} onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telephone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newPatient.telephone}
                  onChange={(e) => setNewPatient({ ...newPatient, telephone: e.target.value })}
                  placeholder="Phone number"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? 'Creating...' : 'Create Patient'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewPatientForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* New Appointment Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-emerald-600" />
            Schedule Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient</Label>
              <Select value={appointmentForm.patientId} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, patientId: v })}>
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={appointmentForm.time}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={appointmentForm.duration.toString()} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, duration: parseInt(v) })}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <CalendarPlus className="w-4 h-4" />
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>

        {/* Today */}
        {todayAppointments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Today&apos;s Appointments ({todayAppointments.length})
            </h4>
            <div className="space-y-2">
              {todayAppointments.map((apt) => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  onDelete={handleDeleteAppointment}
                  onUpdateStatus={handleUpdateStatus}
                  onGoToPatient={handleGoToPatientFile}
                  statusColors={statusColors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingAppointments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Upcoming ({upcomingAppointments.length})
            </h4>
            <div className="space-y-2">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  onDelete={handleDeleteAppointment}
                  onUpdateStatus={handleUpdateStatus}
                  onGoToPatient={handleGoToPatientFile}
                  statusColors={statusColors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past */}
        {pastAppointments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Past ({pastAppointments.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pastAppointments.map((apt) => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  onDelete={handleDeleteAppointment}
                  onUpdateStatus={handleUpdateStatus}
                  onGoToPatient={handleGoToPatientFile}
                  statusColors={statusColors}
                />
              ))}
            </div>
          </div>
        )}

        {appointments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CalendarPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No appointments yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  onDelete, 
  onUpdateStatus, 
  onGoToPatient,
  statusColors,
}: { 
  appointment: any;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onGoToPatient: (patientId: string) => void;
  statusColors: Record<string, string>;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-gray-500" />
        </div>
        <div className="min-w-0">
          <button
            onClick={() => onGoToPatient(appointment.patientId)}
            className="font-medium text-gray-900 hover:text-emerald-600 transition-colors truncate block cursor-pointer text-left"
          >
            {appointment.patient?.name || 'Unknown Patient'}
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{appointment.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appointment.time}</span>
            {appointment.notes && <span className="truncate max-w-32">- {appointment.notes}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={`${statusColors[appointment.status] || 'bg-gray-100 text-gray-600'} text-xs`}>
          {appointment.status}
        </Badge>
        {appointment.status === 'scheduled' && (
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onUpdateStatus(appointment.id, 'in-progress')}>
            <Stethoscope className="w-3 h-3" /> Start
          </Button>
        )}
        {appointment.status === 'in-progress' && (
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-emerald-600" onClick={() => onUpdateStatus(appointment.id, 'completed')}>
            <CheckCircle2 className="w-3 h-3" /> Complete
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-xs h-7 text-red-500 hover:text-red-700" onClick={() => onDelete(appointment.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
