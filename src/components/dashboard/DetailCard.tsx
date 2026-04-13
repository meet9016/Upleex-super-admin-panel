"use client";

import React from "react";

interface DetailCardProps {
  items: {
    label: string;
    value: number | string;
    color?: string;
    subItems?: any[];
  }[];
  position?: "left" | "right";
  openSubItem: string | null;
  onSubItemClick: (label: string, e: React.MouseEvent) => void;
}

export default function DetailCard({
  items,
  position = "right",
  openSubItem,
  onSubItemClick,
}: DetailCardProps) {
  return (
    <div
      className={`absolute z-50 ${
        position === "right" ? "left-50 ml-2" : "right-full mr-2"
      } top-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 space-y-1 min-w-[220px] animate-in fade-in slide-in-from-${
        position === "right" ? "left" : "right"
      }-2 duration-300`}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={`relative group flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${
            openSubItem === item.label ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          onClick={(e) =>
            item.subItems && item.subItems.length > 0 && onSubItemClick(item.label, e)
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">{item.label}</span>
            {item.subItems && item.subItems.length > 0 && (
              <span className="text-[8px] text-slate-300 group-hover:text-slate-500 transition-colors">
                ▶
              </span>
            )}
          </div>
          <span className={`font-bold ${item.color || "text-slate-800"}`}>
            {typeof item.value === "number"
              ? item.value.toLocaleString("en-IN")
              : item.value}
          </span>

          {/* Secondary Nested Card */}
          {openSubItem === item.label && item.subItems && item.subItems.length > 0 && (
            <div
              className={`absolute ${
                position === "right" ? "left-full ml-2" : "right-full mr-2"
              } top-0 min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-2xl p-3 space-y-2 animate-in fade-in slide-in-from-${
                position === "right" ? "left" : "right"
              }-2 duration-200`}
            >
              <p className="text-[10px] font-black  text-slate-400 mb-1 whitespace-nowrap border-b border-slate-100 pb-1">
                {item.label} Status
              </p>
              {item.subItems.map((sub, si) => (
                <div
                  key={si}
                  className="flex items-center justify-between text-[11px] font-bold"
                >
                  <span className="text-slate-500 whitespace-nowrap mr-4">
                    {sub.label}
                  </span>
                  <span className={`${sub.color || "text-slate-800"}`}>
                    {typeof sub.value === "number"
                      ? sub.value.toLocaleString("en-IN")
                      : sub.value}
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
