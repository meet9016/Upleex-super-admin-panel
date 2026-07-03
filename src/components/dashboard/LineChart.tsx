"use client";

import React, { useEffect, useState, useRef } from "react";
import { Activity } from "lucide-react";

interface LineChartProps {
  data: { month: string; amount: number; count?: number }[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  color?: string;
  gradientColor?: string;
  countLabel?: string;
  height?: number;
  sparkline?: boolean;
  labelColor?: string;
}

export default function LineChart({
  data,
  title = "Revenue Trend",
  subtitle = "Monthly performance overview",
  valuePrefix = "₹",
  color = "#3b82f6",
  gradientColor = "rgba(59, 130, 246, 0.1)",
  countLabel = "transactions",
  sparkline = false,
  labelColor,
  height,
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
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
        <Activity className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm font-medium">
          No data available for the selected period
        </p>
        <p className="text-slate-300 text-xs mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  const isManyPoints = data.length > 15;
  const padding = sparkline ? { top: 2, right: 2, bottom: 2, left: 2 } : { top: 20, right: 20, bottom: isManyPoints ? 50 : 35, left: 50 };
  const width = dimensions.width || 800;
  const chartHeightValue = sparkline ? 80 : (height || (dimensions.height || 240));
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = chartHeightValue - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const minVal = Math.min(...data.map((d) => d.amount), 0);
  const range = maxVal - minVal;
  const yScale = (value: number) =>
    chartHeight - ((value - minVal) / range) * chartHeight + padding.top;

  const points = data.map((d, i) => ({
    x: padding.left + i * (chartWidth / (data.length - 1)),
    y: yScale(d.amount),
    value: d.amount,
    month: d.month,
    count: d.count,
  }));

  // Generate Y-axis tick values (5 evenly spaced ticks from 0 to maxVal)
  const yAxisTicks = [0, 1, 2, 3, 4].map(i => Math.round((maxVal * i) / 4));

  // Generate smooth path using cubic bezier
  const getPath = () => {
    if (points.length < 2) return "";
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
    if (!linePath) return "";
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${linePath} L ${lastPoint.x} ${chartHeightValue - padding.bottom} L ${
      firstPoint.x
    } ${chartHeightValue - padding.bottom} Z`;
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
      setTooltipPosition({
        x: points[closestIndex].x,
        y: points[closestIndex].y - 40,
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {!sparkline && title && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div className={`relative ${sparkline ? 'flex-1' : ''}`}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${chartHeightValue}`}
          className={`w-full ${sparkline ? `h-[${chartHeightValue}px]` : 'h-auto'}`}
          onMouseMove={sparkline ? undefined : handleMouseMove}
          onMouseLeave={sparkline ? undefined : handleMouseLeave}
          style={{ cursor: sparkline ? "default" : "crosshair" }}
        >
          <defs>
            <linearGradient
              id={`areaGradient-${color}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
            <filter
              id={`glow-${color}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {!sparkline && yAxisTicks.map((tick, i) => {
            const y = chartHeightValue - padding.bottom - (tick / maxVal) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={labelColor ? "rgba(255,255,255,0.12)" : "#f1f5f9"}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-medium"
                  fill={labelColor || "#94a3b8"}
                >
                  {valuePrefix}
                  {tick.toLocaleString()}
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
          {!sparkline && points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? 8 : 4}
                fill={hoveredPoint === i ? color : "#ffffff"}
                stroke={color}
                strokeWidth={hoveredPoint === i ? 3 : 2}
                className="transition-all duration-200 cursor-pointer"
                style={{
                  filter: hoveredPoint === i ? `url(#glow-${color})` : "none",
                }}
              />
            </g>
          ))}

          {/* X-axis labels */}
          {!sparkline && points.map((point, i) => {
            const isManyPoints = points.length > 15;
            return (
            <text
              key={`label-${i}`}
              x={point.x}
              y={chartHeightValue - padding.bottom + 15}
              textAnchor={isManyPoints ? "end" : "middle"}
              transform={isManyPoints ? `rotate(-90, ${point.x}, ${chartHeightValue - padding.bottom + 15})` : undefined}
              fill={labelColor || (hoveredPoint === i ? "#334155" : "#94a3b8")}
              className={`text-[10px] sm:text-[11px] font-medium transition-colors duration-200`}
            >
              {point.month}
            </text>
          )})}
        </svg>

        {/* Tooltip */}
        {!sparkline && hoveredPoint !== null && points[hoveredPoint] && (
          <div
            className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap flex flex-col gap-1 border border-slate-700">
              <span className="font-semibold text-slate-200">
                {points[hoveredPoint].month}
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-bold">
                  {valuePrefix}
                  {points[hoveredPoint].value.toLocaleString()}
                </span>
                {points[hoveredPoint].count !== undefined && countLabel && (
                  <span className="text-slate-400 font-medium">
                    ({points[hoveredPoint].count} {countLabel})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
