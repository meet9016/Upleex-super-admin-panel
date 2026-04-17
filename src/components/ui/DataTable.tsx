"use client";

import React from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";
import PageLoader from "@/components/common/PageLoader";

// Register all community modules once
if (typeof window !== "undefined") {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

interface DataTableProps<TData> {
  rowData: TData[];
  columnDefs: ColDef<TData>[];
  className?: string;
  pagination?: boolean;
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[];
  height?: string | number;
  rowSelection?: "single" | "multiple";
  onSelectionChanged?: (event: any) => void;
  loading?: boolean;
}

export function DataTable<TData>({
  rowData,
  columnDefs,
  className,
  pagination = true,
  paginationPageSize = 10,
  paginationPageSizeSelector = [10, 20, 50],
  height = "100%",
  rowSelection = "multiple",
  onSelectionChanged,
  loading = false,
}: DataTableProps<TData>) {
  return (
    <div 
      className={cn("ag-theme-quartz w-full relative", className)} 
      style={{ height }}
    >
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-transparent">
          <PageLoader fullScreen={false} />
        </div>
      )}
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
          flex: 1,
          minWidth: 100,
        }}
        rowSelection={rowSelection === "multiple" ? { mode: 'multiRow' } : { mode: 'singleRow' }}
        animateRows={true}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  );
}
