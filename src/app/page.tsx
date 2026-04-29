'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useSession, signOut } from 'next-auth/react';
import WeeklySchedule from '@/components/dental/weekly-schedule';
import ClinicView from '@/components/dental/clinic-view';
import DailySummary from '@/components/dental/daily-summary';
import SettingsView from '@/components/dental/settings-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Stethoscope, Settings, BarChart3, Lock, Eye, EyeOff, ShieldCheck, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LOCKABLE_TABS = ['clinic', 'schedule', 'summary', 'settings'] as const;
type LockableTab = typeof LOCKABLE_TABS[number];

const TAB_LABELS: Record<LockableTab, string> = {
  schedule: 'Schedule',
  clinic: 'Clinic',
  summary: 'Summary',
  settings: 'Settings',
};

function getStoredPasswords(): Record<LockableTab, string | null> {
  if (typeof window === 'undefined') return { schedule: null, clinic: null, summary: null, settings: null };
  try {
    const raw = localStorage.getItem('tab-passwords');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { schedule: null, clinic: null, summary: null, settings: null };
}

function saveStoredPasswords(pw: Record<LockableTab, string | null>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tab-passwords', JSON.stringify(pw));
}

function getUnlockedTabs(): Set<LockableTab> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem('unlocked-tabs');
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveUnlockedTabs(tabs: Set<LockableTab>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('unlocked-tabs', JSON.stringify([...tabs]));
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  dentist: 'Dentist',
  assistant: 'Assistant',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-emerald-100 text-emerald-700',
  dentist: 'bg-blue-100 text-blue-700',
  assistant: 'bg-gray-100 text-gray-700',
};

export default function Home() {
  const { data: session, status } = useSession();
  const { activeTab, setActiveTab, fetchPatients, fetchAppointments, fetchProcedures, fetchDiscounts, patients, appointments, procedures, discounts } = useAppStore();

  const [tabPasswords, setTabPasswords] = useState<Record<LockableTab, string | null>>({ schedule: null, clinic: null, summary: null, settings: null });
  const [unlockedTabs, setUnlockedTabs] = useState<Set<LockableTab>>(new Set());
  const [pendingTab, setPendingTab] = useState<LockableTab | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const init = async () => {
      await fetchProcedures();
      await fetchPatients();
      await fetchAppointments();
      await fetchDiscounts();
    };
    init();
  }, [fetchProcedures, fetchPatients, fetchAppointments, fetchDiscounts]);

  // Load passwords & unlocked state from storage on mount
  useEffect(() => {
    setTabPasswords(getStoredPasswords());
    setUnlockedTabs(getUnlockedTabs());
  }, []);

  const stats = {
    totalPatients: patients.length,
    todayAppointments: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
    totalProcedures: procedures.length,
    activeDiscounts: discounts.filter(d => d.active).length,
  };

  const handleTabChange = (tab: string) => {
    const lockableTab = tab as LockableTab;
    // If this tab has a password set and it's not unlocked, show password prompt
    if (tabPasswords[lockableTab] && !unlockedTabs.has(lockableTab)) {
      setPendingTab(lockableTab);
      setPasswordInput('');
      setPasswordError('');
      setShowPassword(false);
    } else {
      setActiveTab(lockableTab);
    }
  };

  const handlePasswordSubmit = () => {
    if (!pendingTab) return;
    const correctPw = tabPasswords[pendingTab];
    if (passwordInput === correctPw) {
      const newUnlocked = new Set(unlockedTabs);
      newUnlocked.add(pendingTab);
      setUnlockedTabs(newUnlocked);
      saveUnlockedTabs(newUnlocked);
      setActiveTab(pendingTab);
      setPendingTab(null);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const isTabLocked = (tab: LockableTab) => {
    return !!tabPasswords[tab] && !unlockedTabs.has(tab);
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
            <div className="flex items-center gap-3">
              {session?.user && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-medium text-gray-700">{session.user.name}</span>
                    <span className={`text-[10px] px-1.5 py-0 rounded ${ROLE_COLORS[(session.user as any).role] || ROLE_COLORS.assistant}`}>
                      {ROLE_LABELS[(session.user as any).role] || (session.user as any).role}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-gray-400 hover:text-red-500 gap-1"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 mb-6">
            <TabsTrigger value="schedule" className="gap-1.5 text-xs sm:text-sm relative">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
              {isTabLocked('schedule') && <Lock className="w-3 h-3 text-amber-500 absolute top-1 right-1" />}
            </TabsTrigger>
            <TabsTrigger value="clinic" className="gap-1.5 text-xs sm:text-sm relative">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Clinic</span>
              {isTabLocked('clinic') && <Lock className="w-3 h-3 text-amber-500 absolute top-1 right-1" />}
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-1.5 text-xs sm:text-sm relative">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Summary</span>
              {isTabLocked('summary') && <Lock className="w-3 h-3 text-amber-500 absolute top-1 right-1" />}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm relative">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
              {isTabLocked('settings') && <Lock className="w-3 h-3 text-amber-500 absolute top-1 right-1" />}
            </TabsTrigger>
          </TabsList>

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
            <SettingsView
              tabPasswords={tabPasswords}
              onPasswordsChange={(pw) => {
                setTabPasswords(pw);
                saveStoredPasswords(pw);
                // Re-lock tabs whose password was added/changed
                const newUnlocked = new Set(unlockedTabs);
                for (const tab of LOCKABLE_TABS) {
                  if (pw[tab] && !tabPasswords[tab]) {
                    // Password was just set for this tab — lock it
                    newUnlocked.delete(tab);
                  }
                }
                setUnlockedTabs(newUnlocked);
                saveUnlockedTabs(newUnlocked);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Password Prompt Dialog */}
      {pendingTab && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Locked</h3>
                <p className="text-sm text-gray-500">Enter password for {TAB_LABELS[pendingTab]}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password..."
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  className="pr-10"
                  autoFocus
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm font-medium">{passwordError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordSubmit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Unlock
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setPendingTab(null); setPasswordInput(''); setPasswordError(''); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center text-xs text-gray-400">
          Dr.Turk.Dental &copy; {new Date().getFullYear()} &mdash; Dental Practice Management System
        </div>
      </footer>
    </div>
  );
}
