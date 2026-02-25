"use client";

import React from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";

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
}: DataTableProps<TData>) {
  return (
    <div 
      className={cn("ag-theme-quartz w-full", className)} 
      style={{ height }}
    >
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
      />
    </div>
  );
}
