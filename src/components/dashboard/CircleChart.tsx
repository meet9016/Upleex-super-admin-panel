"use client";

import React, { useEffect, useState } from "react";

interface CircleChartProps {
  credited: number;
  debited: number;
  balance: number;
}

export default function CircleChart({
  credited,
  debited,
  balance,
}: CircleChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const total = credited || 1;
  const balancePct = Math.max(0, Math.min(100, (balance / total) * 100));
  const debitedPct = Math.max(0, Math.min(100, (debited / total) * 100));

  const circumference = 2 * Math.PI * 54;
  const debitedStroke = (debitedPct / 100) * circumference;
  const balanceStroke = (balancePct / 100) * circumference;

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
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeOpacity="0.5"
          />

          {/* Debited segment with hover effect */}
          {debitedStroke > 0 && (
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#debitedGradient)"
              strokeWidth="10"
              strokeDasharray={`${debitedStroke} ${circumference - debitedStroke}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out cursor-pointer ${
                hoveredSegment === "debited" ? "stroke-[12px]" : ""
              }`}
              style={{ filter: "url(#shadow)" }}
              onMouseEnter={() => setHoveredSegment("debited")}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Balance segment with hover effect */}
          {balanceStroke > 0 && (
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#balanceGradient)"
              strokeWidth="10"
              strokeDasharray={`${balanceStroke} ${circumference - balanceStroke}`}
              strokeDashoffset={-debitedStroke}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out cursor-pointer ${
                hoveredSegment === "balance" ? "stroke-[12px]" : ""
              }`}
              style={{ filter: "url(#shadow)" }}
              onMouseEnter={() => setHoveredSegment("balance")}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Inner decoration ring */}
          <circle
            cx="60"
            cy="60"
            r="42"
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
            ₹{balance.toLocaleString("en-IN")}
          </span>
          <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-600">
              Total: ₹{credited.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Legend with enhanced styling */}
      <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-[320px]">
        <div
          className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
            hoveredSegment === "balance"
              ? "bg-emerald-50 scale-[1.02] shadow-sm"
              : "hover:bg-slate-50"
          }`}
          onMouseEnter={() => setHoveredSegment("balance")}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
              Available Balance
            </span>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800">
              ₹{balance.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                {balancePct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">of total</span>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
            hoveredSegment === "debited"
              ? "bg-red-50 scale-[1.02] shadow-sm"
              : "hover:bg-slate-50"
          }`}
          onMouseEnter={() => setHoveredSegment("debited")}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
              Total Debited
            </span>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800">
              ₹{debited.toLocaleString("en-IN")}
            </span>
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
