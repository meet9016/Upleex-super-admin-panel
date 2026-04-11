import React from "react";

type StatusBadgeProps = {
  status: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // General
  approved: { label: "Approved", className: "text-green-700 bg-green-50 border-green-200" },
  approval: { label: "Approved", className: "text-green-700 bg-green-50 border-green-200" },
  active: { label: "Active", className: "text-green-700 bg-green-50 border-green-200" },
  rejected: { label: "Rejected", className: "text-rose-700 bg-rose-50 border-rose-200" },
  reject: { label: "Rejected", className: "text-rose-700 bg-rose-50 border-rose-200" },
  inactive: { label: "Inactive", className: "text-gray-600 bg-gray-100 border-gray-200" },
  completed: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  complete: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  pending: { label: "Pending", className: "text-amber-700 bg-amber-50 border-amber-200" },
  // Payment statuses
  paid: { label: "Paid", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  hold: { label: "Hold", className: "text-blue-700 bg-blue-50 border-blue-200" },
  failed: { label: "Failed", className: "text-red-700 bg-red-50 border-red-200" },
  refunded: { label: "Refunded", className: "text-purple-700 bg-purple-50 border-purple-200" },
  // Quote statuses

  successful: { label: "Successful", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  delivery: { label: "Delivery", className: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  // Order statuses
  confirmed: { label: "Confirmed", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  processing: { label: "Processing", className: "text-blue-700 bg-blue-50 border-blue-200" },
  shipped: { label: "Shipped", className: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  out_for_delivery: { label: "Out for Delivery", className: "text-violet-700 bg-violet-50 border-violet-200" },
  delivered: { label: "Delivered", className: "text-teal-700 bg-teal-50 border-teal-200" },
  cancelled: { label: "Cancelled", className: "text-red-700 bg-red-50 border-red-200" },
  returned: { label: "Returned", className: "text-orange-700 bg-orange-50 border-orange-200" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = String(status || "").toLowerCase();
  const config = STATUS_MAP[key] ?? STATUS_MAP["pending"];
  const { label, className } = config;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}