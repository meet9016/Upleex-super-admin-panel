"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, ChevronDown, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { usePermissions } from '@/contexts/PermissionContext';

interface UserProfileDropdownProps {
  userName: string;
  userEmail?: string;
}

export function UserProfileDropdown({ userName, userEmail }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
      }
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <div 
        className="flex items-center gap-3 pr-2 group cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors leading-none">
            {userName}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium mt-1">
            Super Admin
          </p>
        </div>
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold border-2 border-transparent group-hover:border-primary/10 transition-all">
            <User size={20} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></div>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{userName}</p>
                {userEmail && (
                  <p className="text-sm text-gray-500">{userEmail}</p>
                )}
                <p className="text-xs text-blue-600 font-medium">Super Admin</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {hasPermission('admin-permissions') && (
              <button
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Settings size={16} className="text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Admin Settings</p>
                  <p className="text-xs text-gray-500">Manage admin accounts</p>
                </div>
              </button>
            )}

            {hasPermission('admin-permissions') && (
              <button
                onClick={() => {
                  router.push('/settings/create-admin');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <UserPlus size={16} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create Admin</p>
                  <p className="text-xs text-gray-500">Add new admin user</p>
                </div>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="p-1.5 bg-red-100 rounded-lg">
                <LogOut size={16} className="text-red-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">Sign Out</p>
                <p className="text-xs text-red-500">Logout from admin panel</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}