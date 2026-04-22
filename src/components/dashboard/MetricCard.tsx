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
  const [dynamicPosition, setDynamicPosition] = React.useState<"left" | "right">(index % 4 === 3 ? "left" : "right");
  const [positionReady, setPositionReady] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // useLayoutEffect fires before paint — prevents any blink
  React.useLayoutEffect(() => {
    if (isOpen && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const popupWidth = 300;

      if (rect.right + popupWidth > windowWidth && rect.left - popupWidth >= 0) {
        setDynamicPosition("left");
      } else if (rect.left - popupWidth < 0 && rect.right + popupWidth <= windowWidth) {
        setDynamicPosition("right");
      } else {
        setDynamicPosition(rect.right + popupWidth > windowWidth ? "left" : "right");
      }
      setPositionReady(true);
    } else {
      setPositionReady(false);
    }
  }, [isOpen]);

  return (
    <div ref={cardRef} className="relative metric-card-container h-full">
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
        <div className={`transition-opacity duration-150 ${positionReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <DetailCard
            items={hoverItems}
            position={dynamicPosition}
            openSubItem={openSubItem}
            onSubItemClick={onSubItemClick}
          />
        </div>
      )}
    </div>
  );
}
