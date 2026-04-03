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
}

export default function LineChart({
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

  const width = dimensions.width || 800;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

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
    return `${linePath} L ${lastPoint.x} ${height - padding.bottom} L ${
      firstPoint.x
    } ${height - padding.bottom} Z`;
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
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: "crosshair" }}
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
                  {valuePrefix}
                  {value.toLocaleString("en-IN")}
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
          {points.map((point, i) => (
            <text
              key={`label-${i}`}
              x={point.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className={`text-[11px] font-medium transition-colors duration-200 ${
                hoveredPoint === i ? "fill-slate-700" : "fill-slate-400"
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
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-slate-800 text-white rounded-xl shadow-2xl p-3 min-w-[140px]">
              <p className="text-xs font-semibold text-slate-400 mb-1">
                {points[hoveredPoint].month}
              </p>
              <p className="text-lg font-bold">
                {valuePrefix}
                {points[hoveredPoint].value.toLocaleString("en-IN")}
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
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
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
