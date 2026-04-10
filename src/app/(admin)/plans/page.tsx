"use client";

import React, { useState } from "react";
import { FolderPlus, Zap, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductListingTab from "./components/ProductListingTab";
import PriorityPlanTab from "./components/PriorityPlanTab";
import PlanPurchasesTab from "./components/PlanPurchasesTab";
import RentalBoostTab from "./components/RentalBoostTab";
import { TrendingUp } from "lucide-react";


const TABS = [
  {
    key: "listing",
    label: "Product Listing Duration Plan",
    icon: FolderPlus,
    component: ProductListingTab,
  },
  {
    key: "priority",
    label: "Priority Plan",
    icon: Zap,
    component: PriorityPlanTab,
  },
  {
    key: "boost",
    label: "Rental Boost",
    icon: TrendingUp,
    component: RentalBoostTab,
  },
  {
    key: "purchases",
    label: "Plan Purchases",
    icon: CreditCard,
    component: PlanPurchasesTab,
  },
];

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState("listing");

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.component || ProductListingTab;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Plans Management
        </h1>
        {/* <p className="text-sm text-slate-500">
          Manage listing plans, priority visibility, and track all plan purchases.
        </p> */}
      </div>

      {/* Pill Style Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200",
                isActive
                  ? "btn-primary shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <div className={cn(activeTab === "listing" ? "block" : "hidden")}>
          <ProductListingTab />
        </div>
        <div className={cn(activeTab === "priority" ? "block" : "hidden")}>
          <PriorityPlanTab />
        </div>
        <div className={cn(activeTab === "purchases" ? "block" : "hidden")}>
          <PlanPurchasesTab />
        </div>
        <div className={cn(activeTab === "boost" ? "block" : "hidden")}>
          <RentalBoostTab />
        </div>
      </div>
    </div>
  );
}