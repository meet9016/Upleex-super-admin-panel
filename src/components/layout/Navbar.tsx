"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Bell, Search, Menu, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfileDropdown } from "@/components/ui/UserProfileDropdown";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onMenuClick?: () => void;
}

interface AdminNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  createdAt: string;
  data?: any;
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') + '/';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const getTypeColor = (type: string) => {
  if (type === "new_vendor") return "bg-purple-100 text-purple-600";
  if (type === "product_request") return "bg-blue-100 text-blue-600";
  if (type === "service_request") return "bg-green-100 text-green-600";
  if (type === "payment") return "bg-orange-100 text-orange-600";
  return "bg-gray-100 text-gray-600";
};

const getProductTypeBadgeColor = (productType: string) => {
  if (productType === "Rent") return "bg-amber-100 text-amber-700";
  if (productType === "Sell") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
};

const getRedirectPath = (type: string) => {
  if (type === "new_vendor") return "/vendors";
  if (type === "product_request") return "/vendor-products";
  if (type === "service_request") return "/vendor-services";
  if (type === "payment") return "/vendor-payments";
  return "/dashboard";
};

export function Navbar({ onMenuClick }: NavbarProps) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser?.admin?.name || parsedUser?.name || "");
        setUserEmail(parsedUser?.admin?.email || parsedUser?.email || "");
      }
    }
  }, []);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) };
  };

  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}admin/notifications`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch { } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id || (n as any).id === id ? { ...n, is_read: true } : n)));
    await fetch(`${API_BASE}admin/notifications/${id}/read`, { method: "PUT", headers: getHeaders() }).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch(`${API_BASE}admin/notifications/read-all`, { method: "PUT", headers: getHeaders() }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleNewAdminNotif = () => {
      fetchNotifications();
    };

    window.addEventListener('new_admin_notification', handleNewAdminNotif);
    return () => {
      window.removeEventListener('new_admin_notification', handleNewAdminNotif);
    };
  }, [fetchNotifications]);

  // Jab dropdown open ho tab fresh fetch karo
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotifClick = async (notif: AdminNotification) => {
    const id = notif._id || (notif as any).id;
    await markAsRead(id);
    setIsOpen(false);
    router.push(getRedirectPath(notif.type));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-white/80 px-4 backdrop-blur-md lg:px-8 border-slate-100">
      <Button variant="ghost" size="icon" className="mr-2 lg:hidden text-slate-600 hover:bg-slate-50" onClick={onMenuClick}>
        <Menu size={20} />
      </Button>

      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <div className="hidden w-full max-w-sm lg:flex">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input type="search" placeholder="Search dashboards, users, reports..." className="pl-10 h-10 bg-slate-50 border-2 border-slate-200 transition-all rounded-xl" />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center justify-center w-10 h-10 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Bell size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((notif) => {
                    const id = notif._id || (notif as any).id;
                    const productType = notif.data?.productType;
                    return (
                      <button
                        key={id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left flex gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors ${!notif.is_read ? "bg-blue-50/50" : ""}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${getTypeColor(notif.type)}`}>
                          <Bell size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p 
                              title={notif.title}
                              className={`text-sm font-semibold truncate ${!notif.is_read ? "text-slate-900" : "text-slate-700"}`}>
                              {notif.title}
                            </p>
                            {productType && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getProductTypeBadgeColor(productType)}`}>
                                {productType}
                              </span>
                            )}
                          </div>
                          <p 
                            title={notif.body?.replace(/<[^>]*>?/gm, '')}
                            className="text-xs text-slate-500 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: notif.body }} />
                          {notif.data?.vendorName && (
                            <p className="text-[11px] text-slate-400 mt-1">Vendor: {notif.data.vendorName}</p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-1">{formatDate(notif.createdAt)}</p>
                        </div>
                        {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block" />
        <UserProfileDropdown userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
