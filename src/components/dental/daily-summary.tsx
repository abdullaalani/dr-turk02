'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign, TrendingUp, TrendingDown, FlaskConical,
  ChevronLeft, ChevronRight, CalendarDays, User, CreditCard, AlertCircle
} from 'lucide-react';

interface PaymentWithPatient {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
  createdAt: string;
  patient: { id: string; name: string };
}

interface LabExpenseWithPatient {
  id: string;
  patientId: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  patient: { id: string; name: string };
}

interface ProcedureWithPatient {
  id: string;
  patientId: string;
  toothNumber: string;
  procedureId: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
  procedure: { id: string; name: string; price: number };
  patient: { id: string; name: string };
}

export default function DailySummary() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [payments, setPayments] = useState<PaymentWithPatient[]>([]);
  const [labExpenses, setLabExpenses] = useState<LabExpenseWithPatient[]>([]);
  const [procedures, setProcedures] = useState<ProcedureWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', SYP: 'ل.س' };
  function fmtPrice(amount: number, currency?: string): string {
    const sym = CURRENCY_SYMBOLS[currency || 'USD'] || '$';
    return `${sym}${amount.toFixed(2)}`;
  }

  const fetchData = useCallback(async (date: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [paymentsRes, expensesRes, proceduresRes] = await Promise.all([
        fetch(`/api/payments?date=${date}`),
        fetch(`/api/lab-expenses?date=${date}`),
        fetch(`/api/tooth-procedures?date=${date}`),
      ]);

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const filtered = paymentsData.filter((p: PaymentWithPatient) => p.date === date);
        setPayments(filtered);
      } else {
        console.error('Failed to fetch payments:', paymentsRes.status);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setLabExpenses(expensesData);
      } else {
        console.error('Failed to fetch expenses:', expensesRes.status);
      }

      if (proceduresRes.ok) {
        const proceduresData = await proceduresRes.json();
        const filtered = proceduresData.filter((p: ProcedureWithPatient) =>
          p.createdAt.split('T')[0] === date
        );
        setProcedures(filtered);
      } else {
        console.error('Failed to fetch procedures:', proceduresRes.status);
      }

      // If any request failed, show a user-facing error
      if (!paymentsRes.ok || !expensesRes.ok || !proceduresRes.ok) {
        setFetchError('Some data failed to load. The numbers shown may be incomplete.');
      }
    } catch (error) {
      console.error('Fetch daily summary error:', error);
      setFetchError('Failed to load data. Please check your connection and try again.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // Calculations
  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalLabExpenses = labExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalIncome - totalLabExpenses;

  // Group payments by method
  const paymentsByMethod = payments.reduce((acc, p) => {
    if (!acc[p.method]) acc[p.method] = 0;
    acc[p.method] += p.amount;
    return acc;
  }, {} as Record<string, number>);

  // Group lab expenses by patient
  const labExpensesByPatient = labExpenses.reduce((acc, e) => {
    const key = e.patient?.name || 'Unknown';
    if (!acc[key]) acc[key] = { total: 0, items: [] };
    acc[key].total += e.amount;
    acc[key].items.push(e);
    return acc;
  }, {} as Record<string, { total: number; items: LabExpenseWithPatient[] }>);

  const navigateDate = (direction: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isToday = selectedDate === today;

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Summary</h2>
          <p className="text-gray-500 text-sm mt-1">Track your daily income and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto text-sm w-[140px] focus:ring-0"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="text-emerald-600">
              Today
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 font-medium">{formatDate(selectedDate)}</p>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      )}

      {/* Error Banner */}
      {fetchError && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-700">{fetchError}</span>
          <Button variant="ghost" size="sm" onClick={() => fetchData(selectedDate)} className="ml-auto text-xs">Retry</Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-emerald-600 font-medium">Total Income</p>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-700">{fmtPrice(totalIncome)}</p>
            <p className="text-xs text-emerald-500 mt-1">{payments.length} payment{payments.length !== 1 ? 's' : ''} received</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-purple-600 font-medium">Lab Expenses</p>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-700">{fmtPrice(totalLabExpenses)}</p>
            <p className="text-xs text-purple-500 mt-1">{labExpenses.length} expense{labExpenses.length !== 1 ? 's' : ''} recorded</p>
          </CardContent>
        </Card>

        <Card className={netIncome >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className={netIncome >= 0 ? "text-sm text-blue-600 font-medium" : "text-sm text-red-600 font-medium"}>
                Net Income
              </p>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${netIncome >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-5 h-5 ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {fmtPrice(netIncome)}
            </p>
            <p className={`text-xs mt-1 ${netIncome >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              Income minus lab expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      {Object.keys(paymentsByMethod).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Methods Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(paymentsByMethod).map(([method, amount]) => (
                <div key={method} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-xs text-gray-500 capitalize mb-1">{method}</p>
                  <p className="text-lg font-bold text-gray-900">{fmtPrice(amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Payments Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{payment.patient?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          {payment.method}
                          {payment.note ? ` \u2022 ${payment.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-700">{fmtPrice(payment.amount)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between items-center px-1">
                  <span className="font-medium text-gray-700">Total Payments</span>
                  <span className="font-bold text-emerald-700">{fmtPrice(totalIncome)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No payments received on this day</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lab Expenses List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              Lab Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {labExpenses.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(labExpensesByPatient).map(([patientName, data]) => (
                  <div key={patientName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-purple-50/50 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900 text-sm">{patientName}</span>
                      </div>
                      <span className="font-bold text-purple-700">{fmtPrice(data.total)}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {data.items.map((expense) => (
                        <div key={expense.id} className="px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-gray-600">{expense.description}</span>
                          <span className="text-xs font-medium text-gray-900">{fmtPrice(expense.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between items-center px-1">
                  <span className="font-medium text-gray-700">Total Lab Expenses</span>
                  <span className="font-bold text-purple-700">{fmtPrice(totalLabExpenses)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No lab expenses on this day</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Procedures Added Today */}
      {procedures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              Procedures Added Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {procedures.map((tp) => (
                <div key={tp.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                      {tp.toothNumber}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{tp.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        Tooth #{tp.toothNumber} &bull; {tp.procedure?.name}
                        {tp.completed && ' \u2022 Completed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{fmtPrice(tp.procedure?.price)}</span>
                    {tp.completed ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">Done</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
