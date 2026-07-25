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
import { Loader2, Eye, X, Package, User, Tag, Calendar, FileText, Box, Hash } from "lucide-react";
import SearchableDropdown from "./SearchableDropdown";
import StatusBadge from "@/components/common/StatusBadge";
import { toast } from "react-toastify";
import Loader from "@/components/common/Loader";
import PageLoader from "../common/PageLoader";

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
  image?: string;
  description?: string;
  vendor_name?: string;
  billing_type?: string;
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
  image?: string;
  description?: string;
  vendor_name?: string;
  billing_type?: string;
}

interface VendorServiceTreeTableProps {
  vendors: Vendor[];
  onBulkApprove: (serviceIds: string[]) => void;
  onBulkReject?: (serviceIds: string[]) => void;
  onStatusChange: (serviceId: string, status: string) => void;
  approving: boolean;
  rejecting?: boolean;
  loading?: boolean;
}

const ServiceDetailModal = ({ service, isOpen, onClose }: { 
  service: TreeDataItem | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen || !service) return null;

  const InfoCard = ({ icon: Icon, label, value, isPrice = false }: any) => (
    <div className="flex items-start space-x-3 p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all duration-200 border border-gray-100">
      <div className="flex-shrink-0 mt-0.5">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500  mb-1">{label}</p>
        {isPrice ? (
          <p className="text-lg font-bold text-green-600">₹{value?.toLocaleString() || '-'}</p>
        ) : typeof value === 'string' || typeof value === 'number' ? (
          <p className="text-sm font-medium text-gray-900 break-words">{value || '-'}</p>
        ) : (
          <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex-none bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-5 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-none mb-1">Service Details</h3>
                <p className="text-gray-100 text-xs font-medium">View complete service information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

            {/* Product Image section */}
            {service.image && (
              <div className="mb-8 flex justify-center">
                <div className="relative group rounded-2xl p-4 bg-gray-50/50 border border-gray-100 w-full max-w-sm">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="max-h-56 mx-auto object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Product Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              <InfoCard icon={Tag} label="Service Name" value={service.name} />
              <InfoCard icon={User} label="Vendor" value={service.vendor_name} />
              <InfoCard icon={Hash} label="Category" value={service.category_name} />
              <InfoCard icon={FileText} label="Status" value={<StatusBadge status={service.approval_status || 'pending'} />} />
              <InfoCard icon={Calendar} label="Created Date" value={service.createdAt ? new Date(service.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'} />
              <InfoCard icon={Box} label="Price" value={service.price} isPrice={true} />
              <InfoCard icon={Tag} label="Billing Type" value={service.billing_type || '-'} />
            </div>

            {/* Description Section */}
            {service.description && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3 px-1">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <h4 className="text-sm font-bold text-gray-800 ">
                    Description
                  </h4>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm">
                  <div
                    className="text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: service.description }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-none bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all duration-200 outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const { onStatusChange, onViewService } = props.context;
  const uniqueId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  if (props.data?.type !== "service") return null;

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewService) {
      onViewService(props.data);
    }
  };

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
    <>
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex items-center gap-2 w-full mt-[8px]"
      >
        <button
          onClick={handleView}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onFocus={(e) => e.target.blur()}
          tabIndex={-1}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm outline-none focus:outline-none focus:ring-0 flex items-center justify-center h-8"
          title="View Service Details"
        >
          <Eye size={14} />
        </button>
      <div className={`relative flex-1 ${uniqueId}`}>
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
          buttonClassName="h-8 py-1 w-full"
        />
      </div>
      </div>
    </>
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
  loading,
}: VendorServiceTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [approvableCount, setApprovableCount] = useState(0);
  const [rejectableCount, setRejectableCount] = useState(0);
  const [selectedService, setSelectedService] = useState<TreeDataItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
          image: (service as any).image,
          description: (service as any).description,
          vendor_name: (service as any).vendor_name || vendor.business_name,
          billing_type: (service as any).billing_type,
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
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px " },
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

  const handleViewService = useCallback((service: TreeDataItem) => {
    setSelectedService(service);
    setModalOpen(true);
  }, []);

  const context = useMemo(() => ({ 
    onStatusChange, 
    vendorMap,
    onViewService: handleViewService
  }), [onStatusChange, vendorMap, handleViewService]);

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">

        {/* Left side - Heading */}


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
                Reject Selected({rejectableCount})
              </Button>
            )}

            {approvableCount > 0 && (
              <Button
                onClick={handleBulkApprove}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
              >
                {approving ? (
                   <Loader type="button" text="Approving..." iconClassName="text-white" />
                ) : (
                  <>Approve Selected({approvableCount})</>
                )}
              </Button>
            )}
          </div>
        )}

      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-transparent">
            <PageLoader fullScreen={false} />
          </div>
        )}
        <div className={`${isDark ? 'ag-theme-alpine-dark cute-ag-grid' : 'ag-theme-alpine cute-ag-grid'} w-full border border-gray-200 overflow-hidden rounded-lg`} style={{ height: "700px" }}>
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
            overlayNoRowsTemplate="<span></span>"
          />
        </div>
      </div>
      
      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
