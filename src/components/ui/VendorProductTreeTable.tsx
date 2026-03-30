"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
  ClientSideRowModelModule,
  ValidationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  RowSelectionModule,
  QuickFilterModule,
} from "ag-grid-community";
import {
  RowGroupingModule,
  TreeDataModule,
  SetFilterModule,
  ColumnMenuModule,
  ContextMenuModule,
} from "ag-grid-enterprise";
import { Button } from "./Button";
import { Loader2 } from "lucide-react";
import SearchableDropdown from "./SearchableDropdown";
import StatusBadge from "@/components/common/StatusBadge";
import { toast } from "react-toastify";
import Loader from "@/components/common/Loader";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  RowSelectionModule,
  QuickFilterModule,
  RowGroupingModule,
  TreeDataModule,
  SetFilterModule,
  ColumnMenuModule,
  ContextMenuModule,
]);

interface Product {
  _id?: string;
  id?: string;
  product_name: string;
  category_name: string;
  price: number;
  approval_status: string;
  createdAt: string;
}

interface Vendor {
  _id: string;
  vendor_id?: string;
  business_name: string;
  full_name: string;
  products?: Product[];
}

interface TreeDataItem {
  id: string;
  name: string;
  type: "vendor" | "product";
  full_name?: string;
  category_name?: string;
  price?: number;
  approval_status?: string;
  createdAt?: string;
  pending_count?: number;
  approved_count?: number;
  rejected_count?: number;
  product_count?: number;
  children?: TreeDataItem[];
  path?: string[];
}

interface VendorProductTreeTableProps {
  vendors: Vendor[];
  onBulkApprove: (productIds: string[]) => void;
  onBulkReject?: (productIds: string[]) => void;
  onStatusChange: (productId: string, status: string) => void;
  approving: boolean;
  rejecting?: boolean;
}

// Status cell renderer
const StatusCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.type === "vendor") return null;
  return (
    <div className="flex items-center h-full">
      <StatusBadge status={props.value || "pending"} />
    </div>
  );
};

const ActionCellRenderer = (props: ICellRendererParams) => {
  const [updating, setUpdating] = useState(false);
  const { onStatusChange } = props.context;
  const uniqueId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  if (props.data?.type !== "product") return null;

  const handleChange = async (val: string | string[]) => {
    const next = (Array.isArray(val) ? val[0] : val) || '';
    const nextStatus = String(next).toLowerCase();
    const currentStatus = String(props.data?.approval_status || '').toLowerCase();

    if (!nextStatus || nextStatus === currentStatus) {
      return; // no change, avoid defaulting or redundant update
    }

    setUpdating(true);
    try {
      await onStatusChange(props.data.id, nextStatus);
    } finally {
      setUpdating(false);
    }
  };

  // Style tag with unique class
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .${uniqueId} .searchable-dropdown-options,
      .${uniqueId} [class*="options"] {
        max-height: 150px !important;
        overflow-y: auto !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [uniqueId]);

  return (
    <div onClick={(e) => e.stopPropagation()} className="w-40 mt-1">
      <div className={uniqueId}>
        <SearchableDropdown
          options={[
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ]}
          value={String(props.data.approval_status || '').toLowerCase()}
          onChange={handleChange}
          disabled={updating}
          placeholder="Select Status"
          usePortal={true}
          maxHeight="max-h-48"
          showClear={false}
          buttonClassName="h-8 py-1"
        />
      </div>
    </div>
  );
};

// Vendor group cell renderer - reads live counts from context.vendorMap
const VendorGroupCellRenderer = (props: ICellRendererParams) => {
  const { data, context } = props;
  const [counts, setCounts] = useState({
    pending_count: data.pending_count ?? 0,
    approved_count: data.approved_count ?? 0,
    rejected_count: data.rejected_count ?? 0,
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const map = (e as CustomEvent).detail;
      const live = map?.[data.id];
      if (live) {
        setCounts({
          pending_count: (live as any).pending_count ?? 0,
          approved_count: (live as any).approved_count ?? 0,
          rejected_count: (live as any).rejected_count ?? 0,
        });
      }
    };
    window.addEventListener("vendor-counts-updated", handler);
    return () => window.removeEventListener("vendor-counts-updated", handler);
  }, [data.id]);

  if (data.type === "vendor") {
    return (
      <div className="flex items-center gap-3  ">
        <div className="w-8 h-8  mb-2  rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-600 font-semibold text-sm">
            {data.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="mb-3">{data.full_name} · {data.product_count} products</span>
            {counts.pending_count > 0 && (
              <span className="px-1.5   mb-3 rounded-md bg-amber-50 text-amber-600 font-medium">{counts.pending_count} pending</span>
            )}
            {counts.approved_count > 0 && (
              <span className="px-1.5   mb-3  rounded-md bg-green-50 text-green-600 font-medium">{counts.approved_count} approved</span>
            )}
            {counts.rejected_count > 0 && (
              <span className="px-1.5   mb-3  rounded-md bg-red-50 text-red-600 font-medium">{counts.rejected_count} rejected</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700 font-medium">{data.name || "-"}</span>
    </div>
  );
};

export default function VendorProductTreeTable({
  vendors,
  onBulkApprove,
  onBulkReject,
  onStatusChange,
  approving,
  rejecting,
}: VendorProductTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [approvableCount, setApprovableCount] = useState(0);
  const [rejectableCount, setRejectableCount] = useState(0);


  const buildRowData = (vendorList: Vendor[]): TreeDataItem[] =>
    vendorList.map((vendor) => {
      const v = vendor as any;
      const vendorPath = [vendor._id];
      const products = vendor.products || [];
      return {
        id: vendor._id,
        name: vendor.business_name,
        full_name: vendor.full_name,
        type: "vendor" as const,
        pending_count: v.pending_count ?? 0,
        approved_count: v.approved_count ?? 0,
        rejected_count: v.rejected_count ?? 0,
        product_count: products.length,
        path: vendorPath,
        children: products.map((product) => ({
          id: product.id || product._id || "",
          name: product.product_name,
          type: "product" as const,
          category_name: product.category_name,
          price: product.price,
          approval_status: product.approval_status,
          createdAt: product.createdAt,
          path: [...vendorPath, product.id || product._id || ""],
        })),
      };
    });

  const [rowData, setRowData] = useState<TreeDataItem[]>(() => buildRowData(vendors));

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setRowData(buildRowData(vendors));
  }, [vendors]);

  const handleBulkApprove = useCallback(async () => {
    if (!gridRef.current?.api) return;
    const selectedNodes = gridRef.current.api.getSelectedNodes().filter(n => n.data.type === "product");
    const validNodes = selectedNodes.filter(n => n.data.approval_status !== "approved");

    if (validNodes.length === 0 && selectedNodes.length > 0) {
      toast.info("Selected products are already approved");
      return;
    }

    const ids = validNodes.map((n) => n.data.id);
    if (ids.length > 0) {
      await onBulkApprove(ids);
      gridRef.current.api.deselectAll();
      setSelectedCount(0);
    }
  }, [onBulkApprove]);

  const handleBulkReject = useCallback(async () => {
    if (!gridRef.current?.api || !onBulkReject) return;
    const selectedNodes = gridRef.current.api.getSelectedNodes().filter(n => n.data.type === "product");
    const validNodes = selectedNodes.filter(n => n.data.approval_status !== "rejected");

    if (validNodes.length === 0 && selectedNodes.length > 0) {
      toast.info("Selected products are already rejected");
      return;
    }

    const ids = validNodes.map((n) => n.data.id);
    if (ids.length > 0) {
      await onBulkReject(ids);
      gridRef.current.api.deselectAll();
      setSelectedCount(0);
    }
  }, [onBulkReject]);

  const updateCount = useCallback(() => {
    if (!gridRef.current?.api) return;
    const nodes = gridRef.current.api.getSelectedNodes();
    const productNodes = nodes.filter((n) => n.data.type === "product");

    setSelectedCount(productNodes.length);
    setApprovableCount(productNodes.filter((n) => n.data.approval_status !== "approved").length);
    setRejectableCount(productNodes.filter((n) => n.data.approval_status !== "rejected").length);
  }, []);

  const columnDefs: ColDef<TreeDataItem>[] = useMemo(() => [
    {
      headerName: "Category",
      field: "category_name",
      valueGetter: (p: ValueGetterParams<TreeDataItem, string>) =>
        p.data?.type === "product" ? p.data.category_name || "" : "",
      minWidth: 100,
    },
    {
      headerName: "Price",
      field: "price",
      valueGetter: (p: ValueGetterParams<TreeDataItem, number>) =>
        p.data?.type === "product" ? p.data.price : undefined,
      valueFormatter: (p: ValueFormatterParams<TreeDataItem, number>) =>
        p.value ? `₹${p.value}` : "",
      minWidth: 100,
      cellStyle: () => ({ fontWeight: "bold", color: "#059669" }),
    },
    {
      headerName: "Status",
      field: "approval_status",
      cellRenderer: StatusCellRenderer,
      minWidth: 100,
    },
    {
      headerName: "Created",
      field: "createdAt",
      valueFormatter: (p: ValueFormatterParams<TreeDataItem, string>) => {
        if (p.data?.type !== "product") return "";
        return p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
      },
      minWidth: 100,
    },
    {
      headerName: "Action",
      width: 200,
      minWidth: 200,
      maxWidth: 200,
      pinned: "right",
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" },
      cellRenderer: ActionCellRenderer,
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
    filter: false,
  }), []);

  const autoGroupColumnDef: ColDef<TreeDataItem> = useMemo(() => ({
    headerName: "Vendor / Product",
    field: "name",
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: VendorGroupCellRenderer,
      checkbox: true,
    },
    minWidth: 500,
  }), []);

  const rowSelection = useMemo<any>(() => ({
    mode: "multiRow" as const,
    groupSelects: "descendants" as const,
  }), []);

  const getDataPath = useCallback((data: TreeDataItem) => data.path || [data.id], []);
  const getRowId = useCallback((params: any) =>
    params.data.type === "vendor" ? `vendor-${params.data.id}` : `product-${params.data.id}`, []);

  const vendorMap = useMemo(() => {
    const map: Record<string, any> = {};
    vendors.forEach((v) => { map[(v as any)._id] = v; });
    return map;
  }, [vendors]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vendor-counts-updated", { detail: vendorMap }));
  }, [vendorMap]);

  const context = useMemo(() => ({ onStatusChange, vendorMap }), [onStatusChange, vendorMap]);

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-gray-300"
            onClick={() => { gridRef.current?.api.deselectAll(); setSelectedCount(0); }}
          >
            Clear ({selectedCount})
          </Button>
          {onBulkReject && rejectableCount > 0 && (
            <Button onClick={handleBulkReject} disabled={rejecting} className="bg-red-600 hover:bg-red-700">
              <>Reject Selected ({rejectableCount})</>
            </Button>
          )}
          {approvableCount > 0 && (
            <Button onClick={handleBulkApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
              {approving ? (
                <Loader type="button" text="Approving..." iconClassName="text-white" />
              ) : (
                <>Approve Selected ({approvableCount})</>
              )}
            </Button>
          )}
        </div>
      )}

      <div className={`${isDark ? 'ag-theme-alpine-dark cute-ag-grid' : 'ag-theme-alpine cute-ag-grid'} w-full border border-gray-200 overflow-hidden`} style={{ height: "700px" }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          rowSelection={rowSelection}
          treeData={true}
          animateRows={true}
          context={context}
          suppressRowClickSelection={true}
          getRowId={getRowId}
          getDataPath={getDataPath}
          groupDefaultExpanded={0}
          groupDisplayType="singleColumn"
          treeDataChildrenField="children"
          rowHeight={45}
          headerHeight={48}
          getRowStyle={(params) =>
            params.data?.type === "vendor" ? { background: "#f9fafb" } : undefined
          }
          onSelectionChanged={updateCount}
        />
      </div>
    </div>
  );
}
