"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { TrendingUp, Wallet, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import LineChart from "@/components/dashboard/LineChart";

type Range = "weekly" | "monthly" | "yearly" | "custom";

interface ChartDataPoint {
  label: string;
  amount: number;
  count: number;
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toLocaleString("en-IN");
}

export default function AdminProfitCard() {
  const [range, setRange] = useState<Range>("monthly");
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date } | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<ReturnType<typeof flatpickr> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = `?range=${range}`;
      if (range === "custom" && customDates) {
        query += `&startDate=${customDates.start.toISOString()}&endDate=${customDates.end.toISOString()}`;
      }
      const res = await api.get(`${endPointApi.getDashboardStats}${query}`);
      if (res?.data?.success) {
        const data = res.data.data;
        setChartData(data.chartCredits || []);
        setTotalProfit(data.wallets?.totalDebited || 0);
      }
    } catch (e) {
      console.error("Failed to fetch profit data", e);
    } finally {
      setLoading(false);
    }
  }, [range, customDates]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (range !== "custom" || !datePickerRef.current) return;
    if (fpRef.current && !Array.isArray(fpRef.current)) fpRef.current.destroy();
    fpRef.current = flatpickr(datePickerRef.current, {
      mode: "range",
      dateFormat: "M j, Y",
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          setCustomDates({ start: selectedDates[0], end: selectedDates[1] });
        }
      },
    });
    return () => {
      if (fpRef.current && !Array.isArray(fpRef.current)) {
        fpRef.current.destroy();
        fpRef.current = null;
      }
    };
  }, [range]);

  const lineChartData = chartData.map(d => ({
    month: d.label,
    amount: d.amount,
    count: d.count,
  }));

  const tabs: { label: string; value: Range }[] = [
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <Card className="h-full border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header Row */}
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            Total Admin Profit
          </CardTitle>
          <CardDescription>From vendor plans, product listings &amp; platform fees</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRange(tab.value)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all duration-200 ${
                  range === tab.value
                    ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom date picker — inline next to tabs */}
          {range === "custom" && (
            <div className="relative flex items-center">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none z-10" />
              <input
                ref={datePickerRef}
                className="h-7 pl-7 pr-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-medium outline-none cursor-pointer min-w-[160px] placeholder:text-slate-400"
                placeholder="Select date range"
                readOnly
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl font-bold text-slate-800">
            ₹{formatCurrency(totalProfit)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3 w-3" />
            Up this month
          </span>
        </div>
        {/* Chart Area */}
        {loading ? (
          <div className="h-[160px] flex items-center justify-center">
            <div className="w-5 h-5 border-[3px] border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : lineChartData.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center">
            <p className="text-slate-400 text-xs">No data for selected period</p>
          </div>
        ) : (
          <LineChart
            data={lineChartData}
            color="#10b981"
            gradientColor="rgba(16, 185, 129, 0.08)"
            valuePrefix="₹"
            countLabel="transactions"
            height={160}
          />
        )}
      </CardContent>
    </Card>
  );
}
