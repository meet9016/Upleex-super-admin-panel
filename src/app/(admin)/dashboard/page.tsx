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
  ArrowRight,
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
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// Components
import CircleChart from "@/components/dashboard/CircleChart";
import LineChart from "@/components/dashboard/LineChart";
import MetricCard from "@/components/dashboard/MetricCard";
import PlatformOverview from "@/components/dashboard/PlatformOverview";
import BarChart from "@/components/dashboard/BarChart";
import DoughnutChart from "@/components/dashboard/DoughnutChart";
import StackedBarChart from "@/components/dashboard/StackedBarChart";
import AdminProfitCard from "@/components/dashboard/AdminProfitCard";

// Types
import { DashboardStats, TopVendor } from "./types";

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
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [openSubItem, setOpenSubItem] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'revenue' | 'vendors'>('revenue');
  const [chartRange, setChartRange] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date } | null>(null);
  const datePickerRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    // Don't fetch for custom until user has selected dates
    if (chartRange === 'custom' && !customDates) return;
    try {
      let query = `?range=${chartRange}`;
      if (chartRange === 'custom' && customDates) {
        query += `&startDate=${customDates.start.toISOString()}&endDate=${customDates.end.toISOString()}`;
      }
      
      const [dashboardRes, vendorsRes] = await Promise.all([
        api.get(`${endPointApi.getDashboardStats}${query}`),
        api.get(endPointApi.getAllVendors, { params: { page: 1, limit: 10 } })
      ]);
      
      if (dashboardRes?.data?.success && dashboardRes?.data?.data) {
        setStats(dashboardRes.data.data);
      } else {
        throw new Error("Invalid response format");
      }
      
      // Process vendors data
      if (vendorsRes?.data?.data) {
        const vendorsWithCounts: TopVendor[] = vendorsRes.data.data.map((v: any) => {
          const sellCount = v.vendorSellCount || 0;
          const rentCount = v.vendorRentCount || 0;
          const total = sellCount + rentCount;
          return {
            _id: v._id,
            vendor_id: v.vendor_id,
            business_name: v.business_name || v.full_name || v.vendor_id || 'Unknown',
            full_name: v.full_name || v.business_name || v.vendor_id || 'Unknown',
            total_products: total,
            sell_products: sellCount,
            rent_products: rentCount
          };
        }).sort((a: TopVendor, b: TopVendor) => b.total_products - a.total_products).slice(0, 10);
        setTopVendors(vendorsWithCounts);
      }
    } catch (error) {
      console.error(error);
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
        chartCredits: [],
        chartVendors: [],
        extras: {
          totalQuotes: 0,
          totalContacts: 0,
          totalBlogs: 0,
          totalPlans: 0,
        },
        revenueStats: {
          weekly: 0,
          monthly: 0,
          yearly: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [chartRange, customDates]);

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

  useEffect(() => {
    if (chartRange === "custom" && datePickerRef.current) {
      const fp = flatpickr(datePickerRef.current, {
        mode: "range",
        dateFormat: "Y-m-d",
        onChange: (selectedDates) => {
          if (selectedDates.length === 2) {
            setCustomDates({ start: selectedDates[0], end: selectedDates[1] });
          }
        },
      });
      return () => fp.destroy();
    } else if (chartRange !== "custom") {
      // Reset custom dates when switching away
      setCustomDates(null);
    }
  }, [chartRange]);

  if (!isAuthenticated || (loading && !stats)) {
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
      ? (stats?.chartCredits || []).map((item: any) => ({
          month: item.label,
          amount: item.amount,
        }))
      : (stats?.chartVendors || []).map((item: any) => ({
          month: item.label,
          amount: item.count,
        }));

  const topVendorsChartData = topVendors.map(vendor => ({
    label: vendor.business_name || vendor.full_name || vendor.vendor_id || "Unknown Vendor",
    values: [
      { name: "Sell", value: vendor.sell_products, color: "#8b5cf6" },
      { name: "Rent", value: vendor.rent_products, color: "#ec4899" },
    ]
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

      {/* Revenue Breakdown — Static Weekly/Monthly/Yearly Cards */}
      {/* <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Weekly</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Weekly Revenue</p>
            <h4 className="text-2xl font-bold text-slate-800">₹{formatCurrency(stats?.revenueStats?.weekly || 0)}</h4>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Monthly</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Monthly Revenue</p>
            <h4 className="text-2xl font-bold text-slate-800">₹{formatCurrency(stats?.revenueStats?.monthly || 0)}</h4>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Yearly</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Yearly Revenue</p>
            <h4 className="text-2xl font-bold text-slate-800">₹{formatCurrency(stats?.revenueStats?.yearly || 0)}</h4>
          </div>
        </div>
      </div> */}

      {/* Platform Overview full width now */}
      <div className="mb-8">
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Platform Overview
            </CardTitle>
            <CardDescription>Key platform metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <PlatformOverview stats={stats} formatCurrency={formatCurrency} />
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Growth Analytics (60%) + Top Vendors (40%) */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-7 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
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
            <div className="flex flex-wrap items-center gap-2">
              {/* Range Tabs + inline Custom date picker */}
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                {['weekly', 'monthly', 'yearly', 'custom'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                      chartRange === r
                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Custom date picker — inline, same row as tabs */}
              {chartRange === 'custom' && (
                <div className="relative flex items-center">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <input
                    ref={datePickerRef}
                    className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none cursor-pointer min-w-[160px]"
                    placeholder="Select range"
                    readOnly
                  />
                </div>
              )}

              {/* Revenue / Vendors toggle */}
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
                countLabel={chartView === "revenue" ? "transactions" : ""}
              />
          </CardContent>
        </Card>

        {/* Top Vendors by Products (40%) */}
        <Card className="lg:col-span-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                <Users className="h-4 w-4 text-white" />
              </div>
              Top Vendors by Products
            </CardTitle>
            <CardDescription>Vendors with the highest product counts</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <StackedBarChart data={topVendorsChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Fourth Row: Product Distribution, Vendor Types, Product Status Overview, Services Status */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-12">

        <Card className="lg:col-span-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              Product Distribution
            </CardTitle>
            <CardDescription>Sell vs Rent products on platform</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <DoughnutChart
              data={[
                { label: "Sell", value: stats?.products.sell || 0, color: "#8b5cf6" },
                { label: "Rent", value: stats?.products.rent || 0, color: "#ec4899" },
              ]}
              centerText={String(stats?.products.total || 0)}
              centerSubtext="Total Products"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <Users className="h-4 w-4 text-white" />
              </div>
              Vendor Types
            </CardTitle>
            <CardDescription>Service, Product & Both vendors</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <DoughnutChart
              data={[
                { label: "Service", value: stats?.vendors.service || 0, color: "#10b981" },
                { label: "Product", value: stats?.vendors.vendor || 0, color: "#059669" },
                { label: "Both", value: stats?.vendors.both || 0, color: "#047857" },
              ]}
              centerText={String(stats?.vendors.total || 0)}
              centerSubtext="Total Vendors"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Product Status Overview
            </CardTitle>
            <CardDescription>Approved, Pending & Rejected products</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <DoughnutChart
              data={[
                { label: "Approved", value: stats?.products.approved || 0, color: "#10b981" },
                { label: "Pending", value: stats?.products.pending || 0, color: "#f59e0b" },
                { label: "Rejected", value: stats?.products.rejected || 0, color: "#ef4444" },
              ]}
              centerText={String((stats?.products.approved || 0) + (stats?.products.pending || 0) + (stats?.products.rejected || 0))}
              centerSubtext="Total Products"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Services Status
            </CardTitle>
            <CardDescription>Approved, Pending & Rejected services</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <DoughnutChart
              data={[
                { label: "Approved", value: stats?.services.approved || 0, color: "#10b981" },
                { label: "Pending", value: stats?.services.pending || 0, color: "#f59e0b" },
                { label: "Rejected", value: stats?.services.rejected || 0, color: "#ef4444" },
              ]}
              centerText={String(stats?.services.total || 0)}
              centerSubtext="Total Services"
              isPie={true}
            />
          </CardContent>
        </Card>

  
      </div>
    </div>
  );
}