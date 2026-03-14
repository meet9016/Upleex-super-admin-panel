"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { toast } from 'react-toastify';
import { Users, Shield, Save, RefreshCw, UserCheck, Settings, CheckCircle, XCircle } from 'lucide-react';

interface Admin {
  name: string;
  email: string;
  permissions: string[];
}
interface AdminsResponse {
  data: Admin[];
}

interface PagesResponse {
  data: Page[];
}
interface Page {
  name: string;
  displayName: string;
}

export default function AdminPermissionsPage() {
  const searchParams = useSearchParams();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Add ref to track if we've already shown the toast
  const hasShownPreSelectToast = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check for admin email in URL parameters
    const adminEmail = searchParams.get('admin');
    if (adminEmail && admins.length > 0) {
      const adminExists = admins.find(a => a.email === adminEmail);
      if (adminExists) {
        setSelectedAdmin(adminEmail);
        setSelectedPermissions(adminExists.permissions || []);
        
        // Only show toast once
        if (!hasShownPreSelectToast.current) {
          toast.info(`Pre-selected admin: ${adminExists.name}`);
          hasShownPreSelectToast.current = true;
        }
      }
    }
  }, [searchParams, admins]); // Keep the dependencies as is

  const loadData = async () => {
    try {
      setLoading(true);
      const [adminsResponse, pagesResponse] = await Promise.all([
        apiService.getAllAdmins()as Promise<AdminsResponse>,
        apiService.getAvailablePages()as Promise<PagesResponse>
      ]);
      
      setAdmins(adminsResponse.data || []);
      setPages(pagesResponse.data || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSelect = (email: string) => {
    setSelectedAdmin(email);
    const admin = admins.find(a => a.email === email);
    setSelectedPermissions(admin?.permissions || []);
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === pages.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(pages.map(p => p.name));
    }
  };

  const handleSave = async () => {
    if (!selectedAdmin) {
      toast.error('Please select an admin');
      return;
    }

    try {
      setSaving(true);
      await apiService.assignPermissions(selectedAdmin, selectedPermissions);
      
      // Update local state
      setAdmins(prev => prev.map(admin => 
        admin.email === selectedAdmin 
          ? { ...admin, permissions: selectedPermissions }
          : admin
      ));
      
      toast.success('Permissions updated successfully');
    } catch (error) {
      toast.error('Failed to update permissions');
      console.error('Error updating permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedAdminData = admins.find(a => a.email === selectedAdmin);

  // Convert admins to dropdown options
  const adminOptions = admins.map(admin => ({
    label: `${admin.name} (${admin.email})`,
    value: admin.email
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Permissions</h1>
              <p className="text-gray-600 mt-1">Manage page access permissions for admin users</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Admin Selection Card */}
          <div className="xl:col-span-1">
            <Card className="h-fit shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  Select Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Choose admin to manage
                  </label>
                  <SearchableDropdown
                    options={adminOptions}
                    value={selectedAdmin}
                    onChange={(value) => handleAdminSelect(value as string)}
                    placeholder="Search and select admin..."
                    searchable={true}
                    maxHeight="max-h-48"
                  />
                </div>

                {selectedAdminData && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Selected Admin</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{selectedAdminData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{selectedAdminData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Permissions:</span>
                        <span className="font-medium text-blue-600">
                          {selectedAdminData.permissions.length} / {pages.length}
                        </span>
                      </div>
                    </div>

                    {selectedAdminData.permissions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Current Access:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedAdminData.permissions.slice(0, 3).map((permission) => {
                            const page = pages.find(p => p.name === permission);
                            return (
                              <span
                                key={permission}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {page?.displayName || permission}
                              </span>
                            );
                          })}
                          {selectedAdminData.permissions.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{selectedAdminData.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Permission Management Card */}
          <div className="xl:col-span-2">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-5 w-5 text-purple-600" />
                    </div>
                    Page Permissions
                  </CardTitle>
                  {selectedAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs h-8"
                      >
                        {selectedPermissions.length === pages.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {selectedPermissions.length} / {pages.length} selected
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedAdmin ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Shield className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Admin</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Choose an admin from the dropdown to manage their page access permissions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pages.map((page) => {
                        const isSelected = selectedPermissions.includes(page.name);
                        return (
                          <div
                            key={page.name}
                            onClick={() => handlePermissionToggle(page.name)}
                            className={`
                              relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                  ${isSelected 
                                    ? 'bg-blue-500 border-blue-500' 
                                    : 'border-gray-300 bg-white'
                                  }
                                `}>
                                  {isSelected && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${
                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                  }`}>
                                    {page.displayName}
                                  </h4>
                                  <p className={`text-xs ${
                                    isSelected ? 'text-blue-600' : 'text-gray-500'
                                  }`}>
                                    {page.name} access
                                  </p>
                                </div>
                              </div>
                              
                              <div className={`
                                p-1 rounded-full
                                ${isSelected ? 'text-blue-600' : 'text-gray-400'}
                              `}>
                                {isSelected ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <XCircle className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        {selectedAdmin && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Ready to save changes?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPermissions.length} permissions will be assigned to {selectedAdminData?.name}
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}