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

interface Service {
  _id?: string;
  id?: string;
  service_name: string;
  category_name: string;
  price: string | number;
  approval_status: string;
  createdAt: string;
}

interface Vendor {
  _id: string;
  vendor_id?: string;
  business_name: string;
  full_name: string;
  services?: Service[];
}

interface TreeDataItem {
  id: string;
  name: string;
  type: "vendor" | "service";
  full_name?: string;
  category_name?: string;
  price?: string | number;
  approval_status?: string;
  createdAt?: string;
  pending_count?: number;
  approved_count?: number;
  rejected_count?: number;
  service_count?: number;
  children?: TreeDataItem[];
  path?: string[];
}

interface VendorServiceTreeTableProps {
  vendors: Vendor[];
  onBulkApprove: (serviceIds: string[]) => void;
  onBulkReject?: (serviceIds: string[]) => void;
  onStatusChange: (serviceId: string, status: string) => void;
  approving: boolean;
  rejecting?: boolean;
}

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

  if (props.data?.type !== "service") return null;

  const handleChange = async (val: string | string[]) => {
    const next = (Array.isArray(val) ? val[0] : val) || '';
    const nextStatus = String(next).toLowerCase();
    const currentStatus = String(props.data?.approval_status || '').toLowerCase();

    if (!nextStatus || nextStatus === currentStatus) {
      return;
    }

    setUpdating(true);
    try {
      await onStatusChange(props.data.id, nextStatus);
    } finally {
      setUpdating(false);
    }
  };

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
    <div onClick={(e) => e.stopPropagation()} className="w-40 mt-[8px]">
      <div className={uniqueId}>
        <SearchableDropdown
          // key={`${props.data.id}-${String(props.data.approval_status || '').toLowerCase()}`}
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
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-semibold text-sm">
            {data.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>{data.full_name} · {data.service_count} services</span>
            {counts.pending_count > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-medium">{counts.pending_count} pending</span>
            )}
            {counts.approved_count > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 font-medium">{counts.approved_count} approved</span>
            )}
            {counts.rejected_count > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 font-medium">{counts.rejected_count} rejected</span>
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

export default function VendorServiceTreeTable({
  vendors,
  onBulkApprove,
  onBulkReject,
  onStatusChange,
  approving,
  rejecting,
}: VendorServiceTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [approvableCount, setApprovableCount] = useState(0);
  const [rejectableCount, setRejectableCount] = useState(0);

  const buildRowData = (vendorList: Vendor[]): TreeDataItem[] =>
    vendorList.map((vendor) => {
      const v = vendor as any;
      const vendorPath = [vendor._id];
      const services = vendor.services || [];
      return {
        id: vendor._id,
        name: vendor.business_name,
        full_name: vendor.full_name,
        type: "vendor" as const,
        pending_count: v.pending_count ?? 0,
        approved_count: v.approved_count ?? 0,
        rejected_count: v.rejected_count ?? 0,
        service_count: services.length,
        path: vendorPath,
        children: services.map((service) => ({
          id: service.id || service._id || "",
          name: service.service_name,
          type: "service" as const,
          category_name: service.category_name,
          price: service.price,
          approval_status: service.approval_status,
          createdAt: service.createdAt,
          path: [...vendorPath, service.id || service._id || ""],
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
    const selectedNodes = gridRef.current.api.getSelectedNodes().filter(n => n.data.type === "service");
    const validNodes = selectedNodes.filter(n => n.data.approval_status !== "approved");

    const ids = validNodes.map((n) => n.data.id);
    if (ids.length > 0) {
      await onBulkApprove(ids);
      gridRef.current.api.deselectAll();
      setSelectedCount(0);
    } else if (selectedNodes.length > 0) {
      toast.info("Selected services are already approved");
    }
  }, [onBulkApprove]);

  const handleBulkReject = useCallback(async () => {
    if (!gridRef.current?.api || !onBulkReject) return;
    const selectedNodes = gridRef.current.api.getSelectedNodes().filter(n => n.data.type === "service");
    const validNodes = selectedNodes.filter(n => n.data.approval_status !== "rejected");

    const ids = validNodes.map((n) => n.data.id);
    if (ids.length > 0) {
      await onBulkReject(ids);
      gridRef.current.api.deselectAll();
      setSelectedCount(0);
    } else if (selectedNodes.length > 0) {
      toast.info("Selected services are already rejected");
    }
  }, [onBulkReject]);

  const updateCount = useCallback(() => {
    if (!gridRef.current?.api) return;
    const nodes = gridRef.current.api.getSelectedNodes();
    const serviceNodes = nodes.filter((n) => n.data.type === "service");

    setSelectedCount(serviceNodes.length);
    setApprovableCount(serviceNodes.filter((n) => n.data.approval_status !== "approved").length);
    setRejectableCount(serviceNodes.filter((n) => n.data.approval_status !== "rejected").length);
  }, []);

  const columnDefs: ColDef<TreeDataItem>[] = useMemo(() => [
    {
      headerName: "Category",
      field: "category_name",
      valueGetter: (p) => p.data?.type === "service" ? p.data.category_name || "" : "",
      minWidth: 100,
    },
    {
      headerName: "Price",
      field: "price",
      valueGetter: (p) => p.data?.type === "service" ? p.data.price : undefined,
      valueFormatter: (p) => p.value ? `₹${p.value}` : "",
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
      valueFormatter: (p) => {
        if (p.data?.type !== "service") return "";
        return p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
      },
      minWidth: 100,
    },
    {
      headerName: "Action",
      width: 200,
      pinned: "right",
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellRenderer: ActionCellRenderer,
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
  }), []);

  const autoGroupColumnDef: ColDef<TreeDataItem> = useMemo(() => ({
    headerName: "Vendor / Service",
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
    mode: "multiRow",
    groupSelects: "descendants",
  }), []);

  const getDataPath = useCallback((data: TreeDataItem) => data.path || [data.id], []);
  const getRowId = useCallback((params: any) =>
    params.data.type === "vendor" ? `vendor-${params.data.id}` : `service-${params.data.id}`, []);

  const vendorMap = useMemo(() => {
    const map: Record<string, any> = {};
    vendors.forEach((v) => { map[v._id] = v; });
    return map;
  }, [vendors]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vendor-counts-updated", { detail: vendorMap }));
  }, [vendorMap]);

  const context = useMemo(() => ({ onStatusChange, vendorMap }), [onStatusChange, vendorMap]);

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
    
    {/* Left side - Heading */}
    <h1 className="text-3xl font-bold text-gray-900">
      Service Approval
    </h1>

    {/* Right side - Buttons */}
    {selectedCount > 0 && (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="border-gray-300"
          onClick={() => {
            gridRef.current?.api.deselectAll();
            setSelectedCount(0);
          }}
        >
          Clear ({selectedCount})
        </Button>

        {onBulkReject && rejectableCount > 0 && (
          <Button
            onClick={handleBulkReject}
            disabled={rejecting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Reject ({rejectableCount})
          </Button>
        )}

        {approvableCount > 0 && (
          <Button
            onClick={handleBulkApprove}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {approving ? (
              <Loader
                type="button"
                text="Approving..."
                iconClassName="text-white"
              />
            ) : (
              <>Approve ({approvableCount})</>
            )}
          </Button>
        )}
      </div>
    )}
    
  </div>

      <div className={`${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full border border-gray-200 overflow-hidden rounded-lg`} style={{ height: "700px" }}>
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
          rowHeight={50}
          headerHeight={50}
          getRowStyle={(params) =>
            params.data?.type === "vendor" ? { background: "#f8fafc" } : undefined
          }
          onSelectionChanged={updateCount}
        />
      </div>
    </div>
  );
}
