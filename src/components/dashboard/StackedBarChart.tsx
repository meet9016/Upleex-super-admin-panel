"use client";

import React, { useState, useRef, useEffect } from "react";
import { BarChart3 } from "lucide-react";

interface StackedBarChartProps {
  data: {
    label: string;
    values: { name: string; value: number; color: string }[];
  }[];
  title?: string;
  subtitle?: string;
}

export default function StackedBarChart({
  data,
  title,
  subtitle,
}: StackedBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  const maxValue = Math.max(
    ...data.map((item) =>
      item.values.reduce((sum, val) => sum + val.value, 0)
    ),
    1
  );

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
        className="relative w-full overflow-hidden min-h-[380px]"
      >
        <div className="flex flex-col gap-3 px-4 py-2">
          {data.map((item, index) => {
            const total = item.values.reduce((sum, val) => sum + val.value, 0);
            return (
              <div
                key={index}
                className="flex items-center gap-3 w-full group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <p className="text-xs font-medium w-[140px] truncate text-right text-slate-500 group-hover:text-slate-700 transition-colors">
                  {item.label}
                </p>
                <div className="relative h-[32px] flex-1 rounded-lg overflow-hidden bg-slate-100">
                  <div className="flex h-full w-full">
                    {item.values.map((val, valIndex) => {
                      const width = (val.value / maxValue) * 100;
                      let currentWidth = 0;
                      for (let i = 0; i < valIndex; i++) {
                        currentWidth += (item.values[i].value / maxValue) * 100;
                      }
                      return (
                        <div
                          key={valIndex}
                          className="h-full transition-all duration-300 flex items-center justify-center"
                          style={{
                            width: `${width}%`,
                            backgroundColor: val.color,
                            marginLeft: valIndex > 0 ? "0" : "0",
                          }}
                        >
                          {val.value > 0 && (
                            <span className="text-[10px] font-bold text-white px-1">
                              {val.value}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 w-[50px] text-right">
                  {total}
                </span>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 px-4">
          {data[0]?.values.map((val, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: val.color }}
              />
              <span className="text-xs font-medium text-slate-600">
                {val.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
