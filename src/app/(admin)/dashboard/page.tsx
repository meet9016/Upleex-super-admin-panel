"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  ShoppingBag,
  Wallet,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";

// Components
import CircleChart from "@/components/dashboard/CircleChart";
import LineChart from "@/components/dashboard/LineChart";
import MetricCard from "@/components/dashboard/MetricCard";
import PlatformOverview from "@/components/dashboard/PlatformOverview";

// Types
import { DashboardStats } from "./types";

// ─── Utility Functions ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toLocaleString("en-IN");
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [openSubItem, setOpenSubItem] = useState<string | null>(null);
  const [chartView, setChartView] = useState<"revenue" | "vendors">("revenue");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(endPointApi.getDashboardStats);
      if (res?.data?.success && res?.data?.data) {
        setStats(res.data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      toast.error("Failed to load dashboard data");
      setStats({
        vendors: {
          total: 0,
          service: 0,
          vendor: 0,
          both: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
        products: {
          total: 0,
          sell: 0,
          rent: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
        services: { total: 0, pending: 0, approved: 0, rejected: 0 },
        wallets: {
          totalBalance: 0,
          totalCredited: 0,
          totalDebited: 0,
          vendorCount: 0,
        },
        monthlyCredits: [],
        monthlyVendors: [],
        extras: {
          totalQuotes: 0,
          totalContacts: 0,
          totalBlogs: 0,
          totalPlans: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Close details when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".metric-card-container")) {
        setOpenCardId(null);
        setOpenSubItem(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <PageLoader fullScreen={false} />
      </div>
    );
  }

  const cardData = [
    {
      id: "vendors",
      title: "Total Vendors",
      value: stats?.vendors.total || 0,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      hoverItems: [
        {
          label: "Service Vendors",
          value: stats?.vendors.service || 0,
          color: "text-purple-600",
          subItems: [
            {
              label: "Approved",
              value: stats?.vendors.serviceApproved || 0,
              color: "text-green-600",
            },
            {
              label: "Pending",
              value: stats?.vendors.servicePending || 0,
              color: "text-amber-600",
            },
            {
              label: "Rejected",
              value: stats?.vendors.serviceRejected || 0,
              color: "text-red-600",
            },
          ],
        },
        {
          label: "Product Vendors",
          value: stats?.vendors.vendor || 0,
          color: "text-blue-600",
          subItems: [
            {
              label: "Approved",
              value: stats?.vendors.vendorApproved || 0,
              color: "text-green-600",
            },
            {
              label: "Pending",
              value: stats?.vendors.vendorPending || 0,
              color: "text-amber-600",
            },
            {
              label: "Rejected",
              value: stats?.vendors.vendorRejected || 0,
              color: "text-red-600",
            },
          ],
        },
        {
          label: "Both",
          value: stats?.vendors.both || 0,
          color: "text-emerald-600",
          subItems: [
            {
              label: "Approved",
              value: stats?.vendors.bothApproved || 0,
              color: "text-green-600",
            },
            {
              label: "Pending",
              value: stats?.vendors.bothPending || 0,
              color: "text-amber-600",
            },
            {
              label: "Rejected",
              value: stats?.vendors.bothRejected || 0,
              color: "text-red-600",
            },
          ],
        },
      ],
    },
    {
      id: "products",
      title: "Total Products",
      value: stats?.products.total || 0,
      icon: ShoppingBag,
      gradient: "from-emerald-500 to-teal-600",
      hoverItems: [
        {
          label: "Sell Type",
          value: stats?.products.sell || 0,
          color: "text-blue-600",
          subItems: [
            {
              label: "Approved",
              value: stats?.products.sellApproved || 0,
              color: "text-green-600",
            },
            {
              label: "Pending",
              value: stats?.products.sellPending || 0,
              color: "text-amber-600",
            },
            {
              label: "Rejected",
              value: stats?.products.sellRejected || 0,
              color: "text-red-600",
            },
          ],
        },
        {
          label: "Rent Type",
          value: stats?.products.rent || 0,
          color: "text-purple-600",
          subItems: [
            {
              label: "Approved",
              value: stats?.products.rentApproved || 0,
              color: "text-green-600",
            },
            {
              label: "Pending",
              value: stats?.products.rentPending || 0,
              color: "text-amber-600",
            },
            {
              label: "Rejected",
              value: stats?.products.rentRejected || 0,
              color: "text-red-600",
            },
          ],
        },
      ],
    },
    {
      id: "wallets",
      title: "Wallet Balance",
      value: `₹${(stats?.wallets.totalBalance || 0).toLocaleString("en-IN")}`,
      icon: Wallet,
      gradient: "from-amber-500 to-orange-600",
      hoverItems: [
        {
          label: "Total Credited",
          value: `₹${(stats?.wallets.totalCredited || 0).toLocaleString("en-IN")}`,
          color: "text-green-600",
          subItems: [],
        },
        {
          label: "Total Debited",
          value: `₹${(stats?.wallets.totalDebited || 0).toLocaleString("en-IN")}`,
          color: "text-red-600",
          subItems: [],
        },
        {
          label: "Current Balance",
          value: `₹${(stats?.wallets.totalBalance || 0).toLocaleString("en-IN")}`,
          color: "text-blue-600",
          subItems: [],
        },
        {
          label: "Active Wallets",
          value: stats?.wallets.vendorCount || 0,
          color: "text-slate-700",
          subItems: [],
        },
      ],
    },
    {
      id: "quotes",
      title: "Total Quotes",
      value: stats?.extras.totalQuotes || 0,
      icon: FileText,
      gradient: "from-purple-500 to-violet-600",
      hoverItems: [],
    },
  ];

  const chartData =
    chartView === "revenue"
      ? (stats?.monthlyCredits || []).map((item) => ({
          ...item,
          amount: item.amount,
        }))
      : (stats?.monthlyVendors || []).map((item) => ({
          ...item,
          amount: item.count,
        }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-slate-500 mt-1">
            Welcome back! Here&apos;s your platform overview.
          </p>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cardData.map((card, index) => (
          <MetricCard
            key={card.id}
            {...card}
            index={index}
            openCardId={openCardId}
            openSubItem={openSubItem}
            onCardClick={(id) => {
              if (card.hoverItems.length > 0) {
                setOpenCardId(openCardId === id ? null : id);
                setOpenSubItem(null);
              }
            }}
            onSubItemClick={(label, e) => {
              e.stopPropagation();
              setOpenSubItem(openSubItem === label ? null : label);
            }}
          />
        ))}
      </div>

      {/* Second Row: Circle Chart + Platform Overview */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Wallet Distribution
            </CardTitle>
            <CardDescription>Credit, Debit vs Remaining Balance</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <CircleChart
              credited={stats?.wallets.totalCredited || 0}
              debited={stats?.wallets.totalDebited || 0}
              balance={stats?.wallets.totalBalance || 0}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Platform Overview</CardTitle>
            <CardDescription>Key metrics across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformOverview stats={stats} formatCurrency={formatCurrency} />
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Comprehensive Line Chart */}
      <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg bg-gradient-to-br ${
                  chartView === "revenue"
                    ? "from-blue-500 to-indigo-600"
                    : "from-amber-500 to-orange-600"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Growth Analytics
            </CardTitle>
            <CardDescription>
              Visualize platform performance and acquisition trends
            </CardDescription>
          </div>
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => setChartView("revenue")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                chartView === "revenue"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setChartView("vendors")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                chartView === "vendors"
                  ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Vendors
            </button>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <LineChart
            data={chartData}
            title={chartView === "revenue" ? "Monthly Revenue" : "New Vendors"}
            subtitle={
              chartView === "revenue"
                ? "Total wallet credits over time"
                : "Monthly vendor acquisition trend"
            }
            valuePrefix={chartView === "revenue" ? "₹" : ""}
            color={chartView === "revenue" ? "#3b82f6" : "#f59e0b"}
            gradientColor={
              chartView === "revenue"
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(245, 158, 11, 0.1)"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}