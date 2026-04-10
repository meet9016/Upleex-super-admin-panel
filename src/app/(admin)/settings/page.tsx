"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-toastify';
import { Users, UserPlus, Shield, Settings as SettingsIcon, RefreshCw, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

interface Admin {
  name: string;
  email: string;
  permissions: string[];
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllAdmins() as any;
      setAdmins(response.data || []);
    } catch (error) {
      toast.error('Failed to load admins');
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <SettingsIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
                <p className="text-gray-600 mt-1">Manage admin accounts and permissions</p>
              </div>
            </div>
            <Link href="/settings/create-admin">
              <Button className="flex items-center gap-2 btn-primary">
                <UserPlus className="h-4 w-4" />
                Create New Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create Admin</h3>
                  <p className="text-sm text-gray-600">Add new admin user</p>
                </div>
              </div>
              <Link href="/settings/create-admin">
                <Button variant="outline" className="w-full mt-4">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Permissions</h3>
                  <p className="text-sm text-gray-600">Control page access</p>
                </div>
              </div>
              <Link href="/admin-permissions">
                <Button variant="outline" className="w-full mt-4">
                  Manage
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Total Admins</h3>
                  <p className="text-sm text-gray-600">{admins.length} active admins</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={loadAdmins}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin List */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              Admin Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="relative min-h-[200px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading admins...</p>
                </div>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admins Found</h3>
                <p className="text-gray-500 mb-4">Create your first admin account to get started</p>
                <Link href="/settings/create-admin">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Admin
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin, index) => (
                  <div
                    key={admin.email}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{admin.name}</h4>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {admin.permissions.length} permissions
                          </span>
                          {index === 0 && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Main Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/admin-permissions?admin=${encodeURIComponent(admin.email)}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Permissions
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}