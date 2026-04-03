"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Package,
  Wrench,
  UserCheck,
  CreditCard,
  FileText,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";

// ─── Types ───────────────────────────────────────────────────────────
interface DashboardStats {
  vendors: {
    total: number;
    service: number;
    vendor: number;
    both: number;
    pending: number;
    approved: number;
    rejected: number;
    // status break down
    serviceApproved?: number;
    servicePending?: number;
    serviceRejected?: number;
    vendorApproved?: number;
    vendorPending?: number;
    vendorRejected?: number;
    bothApproved?: number;
    bothPending?: number;
    bothRejected?: number;
  };
  products: {
    total: number;
    sell: number;
    rent: number;
    pending: number;
    approved: number;
    rejected: number;
    // status break down
    sellApproved?: number;
    sellPending?: number;
    sellRejected?: number;
    rentApproved?: number;
    rentPending?: number;
    rentRejected?: number;
  };
  services: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  wallets: {
    totalBalance: number;
    totalCredited: number;
    totalDebited: number;
    vendorCount: number;
  };
  monthlyCredits: {
    month: string;
    year: number;
    amount: number;
    count: number;
  }[];
  monthlyVendors: {
    month: string;
    year: number;
    count: number;
  }[];
  extras: {
    totalQuotes: number;
    totalContacts: number;
    totalBlogs: number;
    totalPlans: number;
  };
}

// ─── Professional Circle Chart Component ──────────────────────────────
function CircleChart({
  credited,
  debited,
  balance,
}: {
  credited: number;
  debited: number;
  balance: number;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentDebited, setCurrentDebited] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const total = credited || 1;
  const balancePct = Math.max(0, Math.min(100, (balance / total) * 100));
  const debitedPct = Math.max(0, Math.min(100, (debited / total) * 100));

  const circumference = 2 * Math.PI * 54;
  const debitedStroke = (debitedPct / 100) * circumference;
  const balanceStroke = (balancePct / 100) * circumference;

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [credited, debited, balance]);

  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const incrementBalance = balance / steps;
    const incrementDebited = debited / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= steps) {
        setCurrentBalance(balance);
        setCurrentDebited(debited);
        clearInterval(interval);
      } else {
        setCurrentBalance(prev => Math.min(prev + incrementBalance, balance));
        setCurrentDebited(prev => Math.min(prev + incrementDebited, debited));
        currentStep++;
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [balance, debited]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90 transform transition-all duration-700 ease-out"
          viewBox="0 0 120 120"
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="debitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background circle with subtle gradient */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeOpacity="0.5"
          />

          {/* Debited segment with hover effect */}
          {debitedStroke > 0 && (
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#debitedGradient)"
              strokeWidth="10"
              strokeDasharray={`${debitedStroke} ${circumference - debitedStroke}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out cursor-pointer ${hoveredSegment === 'debited' ? 'stroke-[12px]' : ''
                }`}
              style={{ filter: 'url(#shadow)' }}
              onMouseEnter={() => setHoveredSegment('debited')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Balance segment with hover effect */}
          {balanceStroke > 0 && (
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#balanceGradient)"
              strokeWidth="10"
              strokeDasharray={`${balanceStroke} ${circumference - balanceStroke}`}
              strokeDashoffset={-debitedStroke}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out cursor-pointer ${hoveredSegment === 'balance' ? 'stroke-[12px]' : ''
                }`}
              style={{ filter: 'url(#shadow)' }}
              onMouseEnter={() => setHoveredSegment('balance')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Inner decoration ring */}
          <circle
            cx="60" cy="60" r="42"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Center content with animated counter */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">
            Current Balance
          </span>
          <span className="text-3xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tabular-nums">
            ₹{currentBalance.toLocaleString('en-IN')}
          </span>
          <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-600">
              Total: ₹{credited.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Legend with enhanced styling */}
      <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-[320px]">
        <div
          className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer ${hoveredSegment === 'balance'
            ? 'bg-emerald-50 scale-[1.02] shadow-sm'
            : 'hover:bg-slate-50'
            }`}
          onMouseEnter={() => setHoveredSegment('balance')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Available Balance</span>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800">₹{currentBalance.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                {balancePct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">of total</span>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer ${hoveredSegment === 'debited'
            ? 'bg-red-50 scale-[1.02] shadow-sm'
            : 'hover:bg-slate-50'
            }`}
          onMouseEnter={() => setHoveredSegment('debited')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Total Debited</span>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800">₹{currentDebited.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                {debitedPct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">of total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Professional Line Chart Component with Tooltip ───────────────────
interface LineChartProps {
  data: { month: string; amount: number; count?: number }[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  color?: string;
  gradientColor?: string;
}

function LineChart({
  data,
  title = "Revenue Trend",
  subtitle = "Monthly performance overview",
  valuePrefix = "₹",
  color = "#3b82f6",
  gradientColor = "rgba(59, 130, 246, 0.1)",
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
        <Activity className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm font-medium">No data available for the selected period</p>
        <p className="text-slate-300 text-xs mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  const width = dimensions.width || 800;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.amount), 1);
  const minVal = Math.min(...data.map(d => d.amount), 0);
  const range = maxVal - minVal;
  const yScale = (value: number) => chartHeight - ((value - minVal) / range) * chartHeight + padding.top;

  const points = data.map((d, i) => ({
    x: padding.left + (i * (chartWidth / (data.length - 1))),
    y: yScale(d.amount),
    value: d.amount,
    month: d.month,
    count: d.count,
  }));

  // Generate smooth path using cubic bezier
  const getPath = () => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.4;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) * 0.4;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  // Area path
  const getAreaPath = () => {
    const linePath = getPath();
    if (!linePath) return '';
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${linePath} L ${lastPoint.x} ${height - padding.bottom} L ${firstPoint.x} ${height - padding.bottom} Z`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    let closestIndex = 0;
    let minDist = Infinity;
    points.forEach((point, idx) => {
      const dist = Math.abs(point.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });
    if (minDist < 40) {
      setHoveredPoint(closestIndex);
      setTooltipPosition({ x: points[closestIndex].x, y: points[closestIndex].y - 40 });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'crosshair' }}
        >
          <defs>
            <linearGradient id={`areaGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
            <filter id={`glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Y-axis grid lines */}
          {[...Array(5)].map((_, i) => {
            const value = minVal + (range * (4 - i)) / 4;
            const y = yScale(value);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-mono"
                >
                  {valuePrefix}{value.toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path
            d={getAreaPath()}
            fill={`url(#areaGradient-${color})`}
            className="transition-all duration-500"
          />

          {/* Main line */}
          <path
            d={getPath()}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
            style={{ filter: `url(#glow-${color})` }}
          />

          {/* Data points and hover areas */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? 8 : 4}
                fill={hoveredPoint === i ? color : '#ffffff'}
                stroke={color}
                strokeWidth={hoveredPoint === i ? 3 : 2}
                className="transition-all duration-200 cursor-pointer"
                style={{ filter: hoveredPoint === i ? `url(#glow-${color})` : 'none' }}
              />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((point, i) => (
            <text
              key={`label-${i}`}
              x={point.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className={`text-[11px] font-medium transition-colors duration-200 ${hoveredPoint === i ? 'fill-slate-700' : 'fill-slate-400'
                }`}
            >
              {point.month}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && points[hoveredPoint] && (
          <div
            className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-slate-800 text-white rounded-xl shadow-2xl p-3 min-w-[140px]">
              <p className="text-xs font-semibold text-slate-400 mb-1">
                {points[hoveredPoint].month}
              </p>
              <p className="text-lg font-bold">
                {valuePrefix}{points[hoveredPoint].value.toLocaleString('en-IN')}
              </p>
              {points[hoveredPoint].count !== undefined && (
                <p className="text-xs text-slate-300 mt-1">
                  {points[hoveredPoint].count} transactions
                </p>
              )}
              <div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid #1e293b`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Utility Functions ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toLocaleString("en-IN");
}

// ─── Hover Detail Card Component ─────────────────────────────────────
function DetailCard({
  items,
  position = "right",
  openSubItem,
  onSubItemClick,
}: {
  items: { label: string; value: number | string; color?: string; subItems?: any[] }[];
  position?: "left" | "right";
  openSubItem: string | null;
  onSubItemClick: (label: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className={`absolute z-50 ${position === 'right' ? 'left-50 ml-2' : 'right-full mr-2'} top-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 space-y-1 min-w-[220px] animate-in fade-in slide-in-from-${position === 'right' ? 'left' : 'right'}-2 duration-300`}>
      {items.map((item, i) => (
        <div
          key={i}
          className={`relative group flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${openSubItem === item.label ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
          onClick={(e) => item.subItems && item.subItems.length > 0 && onSubItemClick(item.label, e)}
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">{item.label}</span>
            {item.subItems && item.subItems.length > 0 && (
              <span className="text-[8px] text-slate-300 group-hover:text-slate-500 transition-colors">▶</span>
            )}
          </div>
          <span className={`font-bold ${item.color || "text-slate-800"}`}>
            {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
          </span>

          {/* Secondary Nested Card */}
          {openSubItem === item.label && item.subItems && item.subItems.length > 0 && (
            <div className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} top-0 min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-2xl p-3 space-y-2 animate-in fade-in slide-in-from-${position === 'right' ? 'left' : 'right'}-2 duration-200`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 whitespace-nowrap border-b border-slate-100 pb-1">{item.label} Status</p>
              {item.subItems.map((sub, si) => (
                <div key={si} className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500 whitespace-nowrap mr-4">{sub.label}</span>
                  <span className={`${sub.color || "text-slate-800"}`}>
                    {typeof sub.value === "number" ? sub.value.toLocaleString("en-IN") : sub.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [openSubItem, setOpenSubItem] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'revenue' | 'vendors'>('revenue');

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
      // Set empty stats to avoid undefined errors
      setStats({
        vendors: { total: 0, service: 0, vendor: 0, both: 0, pending: 0, approved: 0, rejected: 0 },
        products: { total: 0, sell: 0, rent: 0, pending: 0, approved: 0, rejected: 0 },
        services: { total: 0, pending: 0, approved: 0, rejected: 0 },
        wallets: { totalBalance: 0, totalCredited: 0, totalDebited: 0, vendorCount: 0 },
        monthlyCredits: [],
        monthlyVendors: [],
        extras: { totalQuotes: 0, totalContacts: 0, totalBlogs: 0, totalPlans: 0 },
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
      if (!target.closest('.metric-card-container')) {
        setOpenCardId(null);
        setOpenSubItem(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      hoverItems: [
        {
          label: "Service Vendors", value: stats?.vendors.service || 0, color: "text-purple-600",
          subItems: [
            { label: "Approved", value: stats?.vendors.serviceApproved || 0, color: "text-green-600" },
            { label: "Pending", value: stats?.vendors.servicePending || 0, color: "text-amber-600" },
            { label: "Rejected", value: stats?.vendors.serviceRejected || 0, color: "text-red-600" },
          ]
        },
        {
          label: "Product Vendors", value: stats?.vendors.vendor || 0, color: "text-blue-600",
          subItems: [
            { label: "Approved", value: stats?.vendors.vendorApproved || 0, color: "text-green-600" },
            { label: "Pending", value: stats?.vendors.vendorPending || 0, color: "text-amber-600" },
            { label: "Rejected", value: stats?.vendors.vendorRejected || 0, color: "text-red-600" },
          ]
        },
        {
          label: "Both", value: stats?.vendors.both || 0, color: "text-emerald-600",
          subItems: [
            { label: "Approved", value: stats?.vendors.bothApproved || 0, color: "text-green-600" },
            { label: "Pending", value: stats?.vendors.bothPending || 0, color: "text-amber-600" },
            { label: "Rejected", value: stats?.vendors.bothRejected || 0, color: "text-red-600" },
          ]
        },
        // { label: "─────────", value: "", color: "text-slate-200", subItems: [] },
        // { label: "Total Approved", value: stats?.vendors.approved || 0, color: "text-green-600", subItems: [] },
        // { label: "Total Pending", value: stats?.vendors.pending || 0, color: "text-amber-600", subItems: [] },
        // { label: "Total Rejected", value: stats?.vendors.rejected || 0, color: "text-red-600", subItems: [] },
      ],
    },
    {
      id: "products",
      title: "Total Products",
      value: stats?.products.total || 0,
      icon: ShoppingBag,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      hoverItems: [
        {
          label: "Sell Type", value: stats?.products.sell || 0, color: "text-blue-600",
          subItems: [
            { label: "Approved", value: stats?.products.sellApproved || 0, color: "text-green-600" },
            { label: "Pending", value: stats?.products.sellPending || 0, color: "text-amber-600" },
            { label: "Rejected", value: stats?.products.sellRejected || 0, color: "text-red-600" },
          ]
        },
        {
          label: "Rent Type", value: stats?.products.rent || 0, color: "text-purple-600",
          subItems: [
            { label: "Approved", value: stats?.products.rentApproved || 0, color: "text-green-600" },
            { label: "Pending", value: stats?.products.rentPending || 0, color: "text-amber-600" },
            { label: "Rejected", value: stats?.products.rentRejected || 0, color: "text-red-600" },
          ]
        },
        // { label: "─────────", value: "", color: "text-slate-200", subItems: [] },
        // { label: "Total Approved", value: stats?.products.approved || 0, color: "text-green-600", subItems: [] },
        // { label: "Total Pending", value: stats?.products.pending || 0, color: "text-amber-600", subItems: [] },
        // { label: "Total Rejected", value: stats?.products.rejected || 0, color: "text-red-600", subItems: [] },
      ],
    },
    {
      id: "wallets",
      title: "Wallet Balance",
      value: `₹${(stats?.wallets.totalBalance || 0).toLocaleString("en-IN")}`,
      icon: Wallet,
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      hoverItems: [
        { label: "Total Credited", value: `₹${(stats?.wallets.totalCredited || 0).toLocaleString("en-IN")}`, color: "text-green-600", subItems: [] },
        { label: "Total Debited", value: `₹${(stats?.wallets.totalDebited || 0).toLocaleString("en-IN")}`, color: "text-red-600", subItems: [] },
        { label: "Current Balance", value: `₹${(stats?.wallets.totalBalance || 0).toLocaleString("en-IN")}`, color: "text-blue-600", subItems: [] },
        { label: "Active Wallets", value: stats?.wallets.vendorCount || 0, color: "text-slate-700", subItems: [] },
      ],
    },
    {
      id: "quotes",
      title: "Total Quotes",
      value: stats?.extras.totalQuotes || 0,
      icon: FileText,
      gradient: "from-purple-500 to-violet-600",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
      hoverItems: [],
    },
  ];

  const chartData = chartView === 'revenue'
    ? (stats?.monthlyCredits || []).map(item => ({ ...item, amount: item.amount }))
    : (stats?.monthlyVendors || []).map(item => ({ ...item, amount: item.count }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s your platform overview.</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      {/* Main Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cardData.map((card, index) => (
          <div
            key={card.id}
            className="relative metric-card-container h-full"
          >
            <Card
              className={`group cursor-pointer border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 overflow-visible h-full ${openCardId === card.id ? 'ring-2 ring-blue-500/20 shadow-md' : ''}`}
              onClick={() => {
                if (card.hoverItems.length > 0) {
                  setOpenCardId(openCardId === card.id ? null : card.id);
                  setOpenSubItem(null);
                }
              }}
            >
              <CardContent className="p-5 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent break-words">
                      {typeof card.value === "number" ? card.value.toLocaleString("en-IN") : card.value}
                    </p>
                    {card.hoverItems.length > 0 && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                        Click for details {openCardId === card.id ? '←' : '→'}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg flex-shrink-0 ml-3`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {openCardId === card.id && card.hoverItems.length > 0 && (
              <DetailCard
                items={card.hoverItems}
                position={index % 4 === 3 ? "left" : "right"}
                openSubItem={openSubItem}
                onSubItemClick={(label, e) => {
                  e.stopPropagation();
                  setOpenSubItem(openSubItem === label ? null : label);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Second Row: Circle Chart + Extra Stats */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        {/* Circle Chart - Wallet Distribution */}
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

        {/* Quick Stats Panel */}
        <Card className="lg:col-span-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Platform Overview</CardTitle>
            <CardDescription>Key metrics across the platform</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Approved Vendors</span>
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
                <span className="text-sm font-semibold text-amber-800">Pending Vendors</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {(stats?.vendors.pending || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-amber-600/70 mt-1">awaiting approval</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Products Pending</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {(stats?.products.pending || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-blue-600/70 mt-1">need review</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">Total Credited</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ₹{formatCurrency(stats?.wallets.totalCredited || 0)}
              </p>
              <p className="text-xs text-purple-600/70 mt-1">
                across {(stats?.wallets.vendorCount || 0)} wallets
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-rose-600" />
                <span className="text-sm font-semibold text-rose-800">Contact Inquiries</span>
              </div>
              <p className="text-2xl font-bold text-rose-600">
                {(stats?.extras.totalContacts || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-rose-600/70 mt-1">total messages</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-semibold text-cyan-800">Active Plans</span>
              </div>
              <p className="text-2xl font-bold text-cyan-600">
                {(stats?.extras.totalPlans || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-cyan-600/70 mt-1">listing plans</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Line Chart with Toggle */}
      <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Analytics Overview
              </CardTitle>
              <CardDescription>Track your platform&apos;s growth over time</CardDescription>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setChartView('revenue')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${chartView === 'revenue'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Revenue
              </button>
              <button
                onClick={() => setChartView('vendors')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${chartView === 'vendors'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Users className="h-3.5 w-3.5" />
                Vendors
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="pt-2">
            <LineChart
              data={chartData}
              title={chartView === 'revenue' ? "Monthly Revenue Growth" : "Monthly Vendor Registrations"}
              subtitle={chartView === 'revenue'
                ? "Wallet credits received from vendors over the last 12 months"
                : "New vendor registrations over the last 12 months"}
              valuePrefix={chartView === 'revenue' ? "₹" : ""}
              color={chartView === 'revenue' ? "#3b82f6" : "#10b981"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>Jump to commonly used sections</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: "Vendor Requests", desc: `${stats?.vendors.pending || 0} pending`, href: "/vendors", icon: Users, color: "blue" },
            { title: "Product Approval", desc: `${stats?.products.pending || 0} pending`, href: "/vendor-products", icon: Package, color: "emerald" },
            { title: "Vendor Wallets", desc: `${stats?.wallets.vendorCount || 0} active`, href: "/vendor-wallets", icon: Wallet, color: "amber" },
            { title: "Quotes", desc: `${stats?.extras.totalQuotes || 0} total`, href: "/quotes", icon: FileText, color: "purple" },
          ].map((action) => (
            <div
              key={action.title}
              onClick={() => router.push(action.href)}
              className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white transition-all hover:bg-slate-50 hover:border-slate-200 hover:shadow-md cursor-pointer"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                <p className="text-xs text-slate-500">{action.desc}</p>
              </div>
              <div className={`p-2 rounded-lg bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                <ArrowUpRight className={`h-4 w-4 text-${action.color}-600`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}