"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const refreshPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyPermissions() as any;
      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        refreshPermissions();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <PermissionContext.Provider value={{
      permissions,
      hasPermission,
      loading,
      refreshPermissions,
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}