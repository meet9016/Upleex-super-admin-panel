"use client";

import React from "react";
import {
  UserCheck,
  TrendingUp,
  Package,
  CreditCard,
  MessageSquare,
  Wrench,
} from "lucide-react";

interface PlatformOverviewProps {
  stats: any;
  formatCurrency: (amount: number) => string;
}

export default function PlatformOverview({
  stats,
  formatCurrency,
}: PlatformOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">
            Approved Vendors
          </span>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {(stats?.vendors.approved || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-green-600/70 mt-1">
          of {(stats?.vendors.total || 0).toLocaleString("en-IN")} total
        </p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Pending Vendors
          </span>
        </div>
        <p className="text-2xl font-bold text-amber-600">
          {(stats?.vendors.pending || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-amber-600/70 mt-1">awaiting approval</p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            Products Pending
          </span>
        </div>
        <p className="text-2xl font-bold text-blue-600">
          {(stats?.products.pending || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-blue-600/70 mt-1">need review</p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">
            Total Credited
          </span>
        </div>
        <p className="text-2xl font-bold text-purple-600">
          ₹{formatCurrency(stats?.wallets.totalCredited || 0)}
        </p>
        <p className="text-xs text-purple-600/70 mt-1">
          across {stats?.wallets.vendorCount || 0} wallets
        </p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-rose-600" />
          <span className="text-sm font-semibold text-rose-800">
            Contact Inquiries
          </span>
        </div>
        <p className="text-2xl font-bold text-rose-600">
          {(stats?.extras.totalContacts || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-rose-600/70 mt-1">total messages</p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="h-4 w-4 text-cyan-600" />
          <span className="text-sm font-semibold text-cyan-800">Total Plans</span>
        </div>
        <p className="text-2xl font-bold text-cyan-600">
          {(stats?.extras.totalPlans || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-cyan-600/70 mt-1">active plans</p>
      </div>
    </div>
  );
}
