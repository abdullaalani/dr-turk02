'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import ReceptionView from '@/components/dental/reception-view';
import WeeklySchedule from '@/components/dental/weekly-schedule';
import ClinicView from '@/components/dental/clinic-view';
import DailySummary from '@/components/dental/daily-summary';
import SettingsView from '@/components/dental/settings-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Calendar, Stethoscope, Settings, BarChart3 } from 'lucide-react';

export default function Home() {
  const { activeTab, setActiveTab, fetchPatients, fetchAppointments, fetchProcedures, fetchDiscounts, patients, appointments, procedures, discounts } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await fetchProcedures();
      await fetchPatients();
      await fetchAppointments();
      await fetchDiscounts();
    };
    init();
  }, [fetchProcedures, fetchPatients, fetchAppointments, fetchDiscounts]);

  const stats = {
    totalPatients: patients.length,
    todayAppointments: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
    totalProcedures: procedures.length,
    activeDiscounts: discounts.filter(d => d.active).length,
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Tooth Logo" className="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Dr.Turk.Dental</h1>
                <p className="text-[10px] text-gray-400 -mt-0.5">Dental Practice Management</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{stats.totalPatients} patients</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{stats.todayAppointments} today</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{stats.totalProcedures} procedures</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-xl mx-auto grid-cols-5 mb-6">
            <TabsTrigger value="reception" className="gap-1.5 text-xs sm:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Reception</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5 text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="clinic" className="gap-1.5 text-xs sm:text-sm">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Clinic</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reception">
            <ReceptionView />
          </TabsContent>
          <TabsContent value="schedule">
            <WeeklySchedule />
          </TabsContent>
          <TabsContent value="clinic">
            <ClinicView />
          </TabsContent>
          <TabsContent value="summary">
            <DailySummary />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center text-xs text-gray-400">
          Dr.Turk.Dental &copy; {new Date().getFullYear()} &mdash; Dental Practice Management System
        </div>
      </footer>
    </div>
  );
}
