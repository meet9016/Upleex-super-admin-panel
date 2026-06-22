"use client";

import React, { useState, useRef, useEffect } from "react";
import { FolderPlus, Zap, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductListingTab from "./components/ProductListingTab";
import PriorityPlanTab from "./components/PriorityPlanTab";
import PlanPurchasesTab from "./components/PlanPurchasesTab";
import RentalBoostTab from "./components/RentalBoostTab";
import ServiceListingTab from "./components/ServiceListingTab";
import ServicePriorityTab from "./components/ServicePriorityTab";
import GeneralPlanTab from "./components/GeneralPlanTab";
import { TrendingUp, Package, Briefcase, ChevronDown, List } from "lucide-react";


const PRODUCT_TABS = [
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
    key: "general",
    label: "General Plan",
    icon: List,
    component: GeneralPlanTab,
  },
  {
    key: "purchases",
    label: "Plan Purchases",
    icon: CreditCard,
    component: PlanPurchasesTab,
    hasSubTabs: true,
  },
];

const SERVICE_TABS = [
  {
    key: "service-listing",
    label: "Service Listing Duration Plan",
    icon: FolderPlus,
    component: ServiceListingTab,
  },
  {
    key: "service-priority",
    label: "Service Priority Plan",
    icon: Zap,
    component: ServicePriorityTab,
  },
  {
    key: "purchases",
    label: "Plan Purchases",
    icon: CreditCard,
    component: PlanPurchasesTab,
    hasSubTabs: true,
  },
];

export default function PlansPage() {
  const [planScope, setPlanScope] = useState<"product" | "service">("product");
  const [activeTab, setActiveTab] = useState("listing");

  const TABS = planScope === "product" ? PRODUCT_TABS : SERVICE_TABS;

  // Handle scope change
  const handleScopeChange = (scope: "product" | "service") => {
    setPlanScope(scope);
    setActiveTab(scope === "product" ? "listing" : "service-listing");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Plans Management
          </h1>
        </div>

        {/* Scope Toggle (Product vs Service) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit self-end">
          <button
            onClick={() => handleScopeChange("product")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer",
              planScope === "product"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Package size={16} />
            Product Plans
          </button>
          <button
            onClick={() => handleScopeChange("service")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer",
              planScope === "service"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Briefcase size={16} />
            Service Plans
          </button>
        </div>
      </div>

      {/* Pill Style Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer",
                isActive
                  ? "btn-primary shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <Icon size={16} />
              {tab.label}
              {tab.hasSubTabs && <ChevronDown size={14} className={cn("ml-0.5 opacity-70", isActive ? "text-white" : "text-slate-400")} />}
            </button>
          );
        })}

      </div>

      <div className="mt-4">
        {planScope === "product" ? (
          <>
            <div className={cn(activeTab === "listing" ? "block" : "hidden")}>
              <ProductListingTab />
            </div>
            <div className={cn(activeTab === "priority" ? "block" : "hidden")}>
              <PriorityPlanTab />
            </div>
            <div className={cn(activeTab === "general" ? "block" : "hidden")}>
              <GeneralPlanTab />
            </div>
            <div className={cn(activeTab === "purchases" ? "block" : "hidden")}>
              <PlanPurchasesTab scope="product" />
            </div>
            <div className={cn(activeTab === "boost" ? "block" : "hidden")}>
              <RentalBoostTab />
            </div>
          </>
        ) : (
          <>
            <div className={cn(activeTab === "service-listing" ? "block" : "hidden")}>
              <ServiceListingTab />
            </div>
            <div className={cn(activeTab === "service-priority" ? "block" : "hidden")}>
              <ServicePriorityTab />
            </div>
            <div className={cn(activeTab === "purchases" ? "block" : "hidden")}>
              <PlanPurchasesTab scope="service" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}