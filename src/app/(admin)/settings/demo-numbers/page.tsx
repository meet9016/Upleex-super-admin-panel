"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { toast } from 'react-toastify';
import { Plus, Trash2, ArrowLeft, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function DemoNumbersPage() {
  const [numbers, setNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNumber, setNewNumber] = useState('');

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSetting('demoNumbers') as any;
      if (res.success && res.data) {
        setNumbers(res.data.value || []);
      }
    } catch (error) {
      toast.error('Failed to load demo numbers');
    } finally {
      setLoading(false);
    }
  };

  const saveNumbers = async (updatedNumbers: string[]) => {
    try {
      const res = await apiService.updateSetting('demoNumbers', updatedNumbers) as any;
      if (res.success) {
        toast.success('Demo numbers updated successfully');
        setNumbers(updatedNumbers);
      }
    } catch (error: any) {
      const msg = error?.message || 'Failed to update demo numbers';
      toast.error(msg);
    }
  };

  const handleAdd = () => {
    const trimmed = newNumber.trim();
    if (!trimmed) return;
    if (!/^\d{10}$/.test(trimmed)) {
      toast.warning('Please enter a valid 10-digit phone number');
      return;
    }
    if (numbers.includes(trimmed)) {
      toast.warning('This number is already in the list');
      return;
    }
    const updatedNumbers = [...numbers, trimmed];
    saveNumbers(updatedNumbers);
    setNewNumber('');
  };

  const handleRemove = (numberToRemove: string) => {
    const updatedNumbers = numbers.filter(n => n !== numberToRemove);
    saveNumbers(updatedNumbers);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
           <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" className="w-10 h-10 p-0 rounded-2xl hover:bg-gray-100 flex items-center justify-center border-gray-200 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
        </Link>
        <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Smartphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dynamic Demo Numbers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage phone numbers that bypass OTP and wallet balance checks</p>
        </div>
      </div>
      </div>

     <Card className="border-0 shadow-xl">
  <CardHeader className="border-b bg-gray-50">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-xl">
          Demo Numbers
        </CardTitle>
        <CardDescription>
          Manage phone numbers that bypass OTP verification
        </CardDescription>
      </div>

      <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
        {numbers.length} Numbers
      </div>
    </div>
  </CardHeader>

  <CardContent className="p-6">
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <input
          type="tel"
          value={newNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            if (val.length <= 10) setNewNumber(val);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Enter 10-digit phone number"
          maxLength={10}
          className="w-full h-11 pl-4 pr-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
        />
      </div>

      <Button
        onClick={handleAdd}
        className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Number
      </Button>
    </div>

    {numbers.length === 0 ? (
      <div className="text-center py-12 border rounded-2xl bg-gray-50">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
          📱
        </div>

        <h3 className="font-semibold text-lg">
          No Demo Numbers
        </h3>

        <p className="text-gray-500 mt-1">
          Add a phone number to get started
        </p>
      </div>
    ) : (
      <div className="grid gap-3">
        {numbers.map((num, idx) => (
          <div
            key={idx}
            className="group flex items-center justify-between p-4 rounded-xl border bg-white hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                {idx + 1}
              </div>

              <div>
                <p className="font-medium">{num}</p>
                <p className="text-xs text-gray-500">
                  Demo Number
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-all text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleRemove(num)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
    </div>
  );
}
