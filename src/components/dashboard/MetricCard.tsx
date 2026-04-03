"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import DetailCard from "./DetailCard";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  hoverItems: any[];
  openCardId: string | null;
  openSubItem: string | null;
  onCardClick: (id: string) => void;
  onSubItemClick: (label: string, e: React.MouseEvent) => void;
  index: number;
}

export default function MetricCard({
  id,
  title,
  value,
  icon: Icon,
  gradient,
  hoverItems,
  openCardId,
  openSubItem,
  onCardClick,
  onSubItemClick,
  index,
}: MetricCardProps) {
  const isOpen = openCardId === id;

  return (
    <div className="relative metric-card-container h-full">
      <Card
        className={`group cursor-pointer border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 overflow-visible h-full ${
          isOpen ? "ring-2 ring-blue-500/20 shadow-md" : ""
        }`}
        onClick={() => onCardClick(id)}
      >
        <CardContent className="p-5 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent break-words">
                {typeof value === "number" ? value.toLocaleString("en-IN") : value}
              </p>
              {hoverItems.length > 0 && (
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                  Click for details {isOpen ? "←" : "→"}
                </p>
              )}
            </div>
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg flex-shrink-0 ml-3`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isOpen && hoverItems.length > 0 && (
        <DetailCard
          items={hoverItems}
          position={index % 4 === 3 ? "left" : "right"}
          openSubItem={openSubItem}
          onSubItemClick={onSubItemClick}
        />
      )}
    </div>
  );
}
