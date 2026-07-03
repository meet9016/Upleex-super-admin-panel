"use client";

import React, { useState, useRef, useEffect } from "react";
import { BarChart3 } from "lucide-react";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  maxValue?: number;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  title,
  subtitle,
  valuePrefix = "",
  maxValue: externalMax,
  horizontal = false,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
        <BarChart3 className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm font-medium">No data available</p>
      </div>
    );
  }

  const maxValue = externalMax || Math.max(...data.map((d) => d.value), 1);
  const chartSize = horizontal ? 280 : 200;
  const barThickness = horizontal
    ? Math.max(28, (dimensions.height - 80) / data.length - 12)
    : Math.max(40, (dimensions.width - 40) / data.length - 16);

  const handleMouseEnter = (
    index: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    setHoveredIndex(index);
    const rect = event.currentTarget.getBoundingClientRect();
    const chartRect = chartRef.current?.getBoundingClientRect();
    if (chartRect) {
      setTooltipPosition({
        x: rect.left - chartRect.left + (horizontal ? rect.width : rect.width / 2),
        y: rect.top - chartRect.top + (horizontal ? rect.height / 2 : 0),
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
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
      <div
        ref={chartRef}
        className={`relative w-full overflow-hidden ${
          horizontal ? "min-h-[380px]" : "h-72"
        }`}
      >
        {horizontal ? (
          <div className="absolute inset-0 flex flex-col items-start gap-3 px-4 py-2">
            {data.map((item, index) => {
              const width = (item.value / maxValue) * (dimensions.width - 220);
              const color = item.color || "#3b82f6";
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 w-full group"
                  onMouseEnter={(e) => handleMouseEnter(index, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <p className={`text-xs font-medium w-[140px] truncate text-right transition-colors duration-200 ${
                    hoveredIndex === index ? 'text-slate-700' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </p>
                  <div
                    className="relative h-full transition-all duration-300 ease-out flex-1"
                    style={{
                      height: `${barThickness}px`,
                    }}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 rounded-r-lg transition-all duration-300 ease-out shadow-sm`}
                      style={{
                        width: `${width}px`,
                        background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
                        opacity: hoveredIndex === index ? 1 : 0.85,
                        transform: hoveredIndex === index ? 'scaleX(1.02)' : 'scaleX(1)',
                        transformOrigin: 'left',
                        boxShadow: hoveredIndex === index ? `0 4px 15px -3px ${color}66` : 'none',
                      }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                      {item.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-end justify-center gap-4 px-4 pb-8">
            {data.map((item, index) => {
              const height = (item.value / maxValue) * chartSize;
              const color = item.color || "#3b82f6";
              
              return (
                <div
                  key={index}
                  className="flex flex-col items-center group"
                  onMouseEnter={(e) => handleMouseEnter(index, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className="relative w-full transition-all duration-300 ease-out"
                    style={{
                      height: `${chartSize}px`,
                      width: `${barThickness}px`,
                    }}
                  >
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-300 ease-out shadow-sm`}
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(0deg, ${color}cc 0%, ${color} 100%)`,
                        opacity: hoveredIndex === index ? 1 : 0.8,
                        transform: hoveredIndex === index ? 'scaleY(1.03)' : 'scaleY(1)',
                        transformOrigin: 'bottom',
                        boxShadow: hoveredIndex === index ? `0 -4px 15px -3px ${color}66` : 'none',
                      }}
                    />
                  </div>
                  <p className={`text-xs font-medium mt-2 transition-colors duration-200 ${
                    hoveredIndex === index ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: horizontal
                ? "translate(10px, -50%)"
                : "translate(-50%, -100%)",
            }}
          >
            <div className="bg-slate-800 text-white rounded-xl shadow-2xl p-3 min-w-[100px] text-center">
              <p className="text-xs font-semibold text-slate-400 mb-1">
                {data[hoveredIndex].label}
              </p>
              <p className="text-lg font-bold">
                {valuePrefix}
                {data[hoveredIndex].value.toLocaleString("en-IN")}
              </p>
              <div
                className={`absolute ${
                  horizontal
                    ? "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2"
                    : "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                }`}
                style={{
                  width: 0,
                  height: 0,
                  ...(horizontal
                    ? {
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        borderRight: "6px solid #1e293b",
                      }
                    : {
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "6px solid #1e293b",
                      }),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
