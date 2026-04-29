'use client';

import React, { useState } from 'react';
import { useAppStore, Procedure, DiscountSetting } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, DollarSign, Percent, Edit2, Trash2, Plus,
  Check, X, Calendar, Tag, FlaskConical, Lock, BarChart3, Stethoscope
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'SYP', label: 'SYP (ل.س)', symbol: 'ل.س' },
] as const;

function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
}

function formatPrice(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

const LOCKABLE_TABS = ['schedule', 'clinic', 'summary', 'settings'] as const;
type LockableTab = typeof LOCKABLE_TABS[number];

const TAB_LABELS: Record<LockableTab, { label: string; icon: React.ReactNode }> = {
  schedule: { label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
  clinic: { label: 'Clinic', icon: <Stethoscope className="w-4 h-4" /> },
  summary: { label: 'Summary', icon: <BarChart3 className="w-4 h-4" /> },
  settings: { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
};

interface SettingsViewProps {
  tabPasswords: Record<LockableTab, string | null>;
  onPasswordsChange: (pw: Record<LockableTab, string | null>) => void;
}

export default function SettingsView({ tabPasswords, onPasswordsChange }: SettingsViewProps) {
  const { procedures, discounts, fetchProcedures, fetchDiscounts } = useAppStore();
  const { toast } = useToast();

  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editLabCost, setEditLabCost] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [discountForm, setDiscountForm] = useState({ percentage: '', startDate: '', endDate: '' });
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);

  // Password management state
  const [passwordTab, setPasswordTab] = useState<LockableTab | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Group procedures by category
  const proceduresByCategory = procedures.reduce((acc, proc) => {
    if (!acc[proc.category]) acc[proc.category] = [];
    acc[proc.category].push(proc);
    return acc;
  }, {} as Record<string, Procedure[]>);

  const handleUpdateProcedure = async (id: string) => {
    if (!editPrice) return;
    try {
      const updateData: any = { price: parseFloat(editPrice), currency: editCurrency };
      if (editLabCost !== '') {
        updateData.labCost = parseFloat(editLabCost);
      }
      const res = await fetch(`/api/procedures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        await fetchProcedures();
        setEditingProcedureId(null);
        setEditPrice('');
        setEditLabCost('');
        setEditCurrency('USD');
        toast({ title: 'Success', description: 'Procedure updated' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update procedure', variant: 'destructive' });
    }
  };

  const handleDeleteProcedure = async (id: string) => {
    try {
      const res = await fetch(`/api/procedures/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProcedures();
        toast({ title: 'Success', description: 'Procedure deleted' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete procedure', variant: 'destructive' });
    }
  };

  const handleCreateDiscount = async () => {
    if (!discountForm.percentage || !discountForm.startDate || !discountForm.endDate) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    setIsAddingDiscount(true);
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountForm),
      });
      if (res.ok) {
        await fetchDiscounts();
        setDiscountForm({ percentage: '', startDate: '', endDate: '' });
        toast({ title: 'Success', description: 'Discount period created' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create discount', variant: 'destructive' });
    }
    setIsAddingDiscount(false);
  };

  const handleToggleDiscount = async (discount: DiscountSetting) => {
    try {
      await fetch(`/api/discounts/${discount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !discount.active }),
      });
      await fetchDiscounts();
      toast({ title: 'Success', description: `Discount ${!discount.active ? 'activated' : 'deactivated'}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update discount', variant: 'destructive' });
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      await fetchDiscounts();
      toast({ title: 'Success', description: 'Discount deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete discount', variant: 'destructive' });
    }
  };

  const now = new Date().toISOString().split('T')[0];

  const handleSetPassword = (tab: LockableTab) => {
    if (!newPassword) {
      setPasswordError('Password cannot be empty');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    const updated = { ...tabPasswords, [tab]: newPassword };
    onPasswordsChange(updated);
    setPasswordTab(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    toast({ title: 'Success', description: `Password set for ${TAB_LABELS[tab].label}` });
  };

  const handleRemovePassword = (tab: LockableTab) => {
    const updated = { ...tabPasswords, [tab]: null };
    onPasswordsChange(updated);
    toast({ title: 'Success', description: `Password removed from ${TAB_LABELS[tab].label}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-gray-600" />
          Settings
        </h2>
        <p className="text-gray-500 text-sm mt-1">Manage passwords, procedure prices, currencies, lab costs, and discount periods</p>
      </div>

      {/* Password Lock Section */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Section Password Locks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Optionally protect sections with a password. When set, users must enter the password before accessing that section. Each section can have its own separate password.
          </p>

          <div className="space-y-2">
            {LOCKABLE_TABS.map((tab) => {
              const hasPassword = !!tabPasswords[tab];
              const isEditing = passwordTab === tab;
              const tabInfo = TAB_LABELS[tab];

              return (
                <div
                  key={tab}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border transition-colors ${
                    hasPassword ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      hasPassword ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {tabInfo.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
                        {tabInfo.label}
                        {hasPassword && (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1">
                            <Lock className="w-2.5 h-2.5" /> Protected
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {hasPassword ? 'Password required to access' : 'No password set'}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="w-full sm:w-auto space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                          className="h-8 text-sm w-32"
                        />
                        <Input
                          type="password"
                          placeholder="Confirm"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                          className="h-8 text-sm w-32"
                        />
                      </div>
                      {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => handleSetPassword(tab)}>
                          <Check className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setPasswordTab(null); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setPasswordTab(tab);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                      >
                        {hasPassword ? <Edit2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {hasPassword ? 'Change' : 'Set Password'}
                      </Button>
                      {hasPassword && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-500 hover:text-red-700"
                          onClick={() => handleRemovePassword(tab)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Discount Management */}
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-600" />
            Discount Periods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Create time-limited discount periods. When active, all patient totals will reflect the discount percentage.
          </p>

          {/* Add discount form */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <div className="space-y-1">
              <Label className="text-xs">Discount %</Label>
              <Input
                type="number"
                step="1"
                min="1"
                max="100"
                value={discountForm.percentage}
                onChange={(e) => setDiscountForm({ ...discountForm, percentage: e.target.value })}
                placeholder="e.g. 20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={discountForm.startDate}
                onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={discountForm.endDate}
                onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateDiscount} disabled={isAddingDiscount} className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-1">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Existing discounts */}
          {discounts.length > 0 ? (
            <div className="space-y-2">
              {discounts.map((discount) => {
                const isActive = discount.active && discount.startDate <= now && discount.endDate >= now;
                const isExpired = discount.endDate < now;
                return (
                  <div
                    key={discount.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActive ? 'bg-amber-50 border-amber-200' : isExpired ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {discount.percentage}%
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {discount.percentage}% Discount
                          {isActive && <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-[10px]">ACTIVE</Badge>}
                          {isExpired && <Badge className="ml-2 bg-gray-100 text-gray-500 text-[10px]">EXPIRED</Badge>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {discount.startDate} → {discount.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={discount.active}
                        onCheckedChange={() => handleToggleDiscount(discount)}
                      />
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={() => handleDeleteDiscount(discount.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No discount periods configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Procedure Prices, Currencies & Lab Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Procedure Prices &amp; Currencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Set the <strong>price</strong>, <strong>currency</strong> (USD or Syrian Pound), and <strong>lab cost</strong> for each procedure. Lab costs are automatically added as expenses when a procedure is assigned.
          </p>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_70px_90px_90px_70px] gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <span>Procedure</span>
            <span className="text-center">Currency</span>
            <span className="text-right">Price</span>
            <span className="text-right">Lab Cost</span>
            <span></span>
          </div>

          <div className="space-y-0">
            {Object.entries(proceduresByCategory).map(([category, procs]) => (
              <div key={category}>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50/80 border-b border-gray-100">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{category}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {procs.map((proc) => {
                    const currSymbol = getCurrencySymbol(proc.currency || 'USD');
                    return (
                      <div
                        key={proc.id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_70px_90px_90px_70px] gap-1 sm:gap-2 items-center py-2.5 px-3 hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-sm text-gray-800">{proc.name}</span>

                        {editingProcedureId === proc.id ? (
                          <>
                            <div>
                              <Select value={editCurrency} onValueChange={setEditCurrency}>
                                <SelectTrigger className="h-8 text-xs w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CURRENCIES.map(c => (
                                    <SelectItem key={c.value} value={c.value} className="text-xs">
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">{getCurrencySymbol(editCurrency)}</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-full h-8 text-sm"
                                placeholder="Price"
                                autoFocus
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-purple-400">{getCurrencySymbol(editCurrency)}</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={editLabCost}
                                onChange={(e) => setEditLabCost(e.target.value)}
                                className="w-full h-8 text-sm"
                                placeholder="Lab cost"
                              />
                            </div>
                            <div className="flex items-center gap-0.5 justify-end">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" onClick={() => handleUpdateProcedure(proc.id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400" onClick={() => { setEditingProcedureId(null); setEditPrice(''); setEditLabCost(''); setEditCurrency('USD'); }}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-center">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${
                                proc.currency === 'SYP' ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              }`}>
                                {proc.currency || 'USD'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-sm font-semibold text-gray-900">{formatPrice(proc.price, proc.currency || 'USD')}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <span className={`text-sm font-medium ${(proc.labCost || 0) > 0 ? 'text-purple-600' : 'text-gray-300'}`}>
                                {formatPrice(proc.labCost || 0, proc.currency || 'USD')}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600"
                                onClick={() => {
                                  setEditingProcedureId(proc.id);
                                  setEditPrice(proc.price.toString());
                                  setEditLabCost((proc.labCost || 0).toString());
                                  setEditCurrency(proc.currency || 'USD');
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
                                onClick={() => handleDeleteProcedure(proc.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {procedures.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No procedures configured. Seed the default list.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
