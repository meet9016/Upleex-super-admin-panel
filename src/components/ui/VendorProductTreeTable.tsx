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
import PageLoader from "@/components/common/PageLoader";

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
  sub_category_name?: string;
  price: number;
  approval_status: string;
  createdAt: string;
  product_main_image?: string;
  description?: string;
  vendor_name?: string;
  product_type_name?: string;
  product_type_id?: string;
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
  sub_category_name?: string;
  price?: number;
  approval_status?: string;
  createdAt?: string;
  pending_count?: number;
  approved_count?: number;
  rejected_count?: number;
  product_count?: number;
  children?: TreeDataItem[];
  path?: string[];
  product_main_image?: string;
  description?: string;
  vendor_name?: string;
}

interface VendorProductTreeTableProps {
  vendors: Vendor[];
  onBulkApprove: (productIds: string[]) => void;
  onBulkReject?: (productIds: string[]) => void;
  onStatusChange: (productId: string, status: string) => void;
  approving: boolean;
  rejecting?: boolean;
  loading?: boolean;
}

// Product Detail Modal Component
const ProductDetailModal = ({ product, isOpen, onClose }: { product: TreeDataItem | null; isOpen: boolean; onClose: () => void }) => {
  if (!isOpen || !product) return null;

  const InfoCard = ({ icon: Icon, label, value, isPrice = false }: any) => (
    <div className="flex items-start space-x-3 p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all duration-200 border border-gray-100">
      <div className="flex-shrink-0 mt-0.5">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
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
                <h3 className="text-lg font-bold leading-none mb-1">Product Details</h3>
                <p className="text-indigo-100 text-xs font-medium">View complete product information</p>
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
            {product.product_main_image && (
              <div className="mb-8 flex justify-center">
                <div className="relative group rounded-2xl p-4 bg-gray-50/50 border border-gray-100 w-full max-w-sm">
                  <img
                    src={product.product_main_image}
                    alt={product.name}
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
              <InfoCard icon={Tag} label="Product Name" value={product.name} />
              <InfoCard icon={User} label="Vendor" value={product.vendor_name} />
              <InfoCard icon={Hash} label="Category" value={product.category_name} />
              <InfoCard icon={Hash} label="Sub Category" value={product.sub_category_name} />
              <InfoCard icon={FileText} label="Status" value={<StatusBadge status={product.approval_status || 'pending'} />} />
              <InfoCard icon={Calendar} label="Created Date" value={product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'} />
              <InfoCard icon={Box} label="Price" value={product.price} isPrice={true} />
            </div>

            {/* Description Section */}
            {product.description && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3 px-1">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Description
                  </h4>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm">
                  <div
                    className="text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
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

// Status cell renderer
const StatusCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.type === "vendor") return null;
  return (
    <div className="flex items-center h-full">
      <StatusBadge status={props.value || "pending"} />
    </div>
  );
};

// Action Cell Renderer with View button
const ActionCellRenderer = (props: ICellRendererParams) => {
  const [updating, setUpdating] = useState(false);
  const { onStatusChange, onViewProduct } = props.context;
  const uniqueId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  if (props.data?.type !== "product") return null;

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewProduct) {
      onViewProduct(props.data);
    }
  };

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
    <>
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex items-center gap-2 w-full"
      >
        <button
          onClick={handleView}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onFocus={(e) => e.target.blur()}
          tabIndex={-1}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm outline-none focus:outline-none focus:ring-0"
          title="View Product Details"
        >
          <Eye size={14} />
        </button>
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
            maxHeight="max-h-48 max-w-[135px]"
            showClear={false}
            buttonClassName="h-8 py-1 w-[135px]"
          />
        </div>
      </div>
    </>
  );
};

// Vendor group cell renderer
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
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 mb-2 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-600 font-semibold text-sm">
            {data.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="mb-3">{data.full_name} · {data.product_count} products</span>
            {counts.pending_count > 0 && (
              <span className="px-1.5 mb-3 rounded-md bg-amber-50 text-amber-600 font-medium">{counts.pending_count} pending</span>
            )}
            {counts.approved_count > 0 && (
              <span className="px-1.5 mb-3 rounded-md bg-green-50 text-green-600 font-medium">{counts.approved_count} approved</span>
            )}
            {counts.rejected_count > 0 && (
              <span className="px-1.5 mb-3 rounded-md bg-red-50 text-red-600 font-medium">{counts.rejected_count} rejected</span>
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
  loading,
}: VendorProductTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [approvableCount, setApprovableCount] = useState(0);
  const [rejectableCount, setRejectableCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<TreeDataItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'rent' | 'sell'>('rent');

  const processedVendors = useMemo(() => {
    const map: Record<string, any> = {};
    const filteredVendors: any[] = [];

    vendors.forEach((vendor) => {
      const v = vendor as any;
      const products = vendor.products || [];

      const filteredProducts = products.filter(p => {
        const typeName = (p.product_type_name || '').toLowerCase();
        return typeName === activeTab;
      });

      if (filteredProducts.length > 0) {
        let pending = 0, approved = 0, rejected = 0;
        filteredProducts.forEach(p => {
          if (p.approval_status === 'pending') pending++;
          if (p.approval_status === 'approved') approved++;
          if (p.approval_status === 'rejected') rejected++;
        });

        const newVendor = {
          ...v,
          pending_count: pending,
          approved_count: approved,
          rejected_count: rejected,
          products: filteredProducts
        };

        map[v._id] = newVendor;
        filteredVendors.push(newVendor);
      }
    });
    return { map, filteredVendors };
  }, [vendors, activeTab]);

  const { map: vendorMap, filteredVendors } = processedVendors;

  const buildRowData = useCallback((vendorList: Vendor[]): TreeDataItem[] => {
    return vendorList.map((vendor) => {
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
          sub_category_name: product.sub_category_name,
          price: product.price,
          approval_status: product.approval_status,
          createdAt: product.createdAt,
          product_main_image: product.product_main_image,
          description: product.description,
          vendor_name: product.vendor_name || vendor.business_name,
          path: [...vendorPath, product.id || product._id || ""],
        })),
      };
    });
  }, []);

  const [rowData, setRowData] = useState<TreeDataItem[]>([]);

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
    setRowData(buildRowData(filteredVendors));
  }, [filteredVendors, buildRowData]);

  const handleViewProduct = useCallback((product: TreeDataItem) => {
    setSelectedProduct(product);
    setModalOpen(true);
  }, []);

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
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px " },
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

  // vendorMap is now managed by processedVendors up above

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vendor-counts-updated", { detail: vendorMap }));
  }, [vendorMap]);

  const context = useMemo(() => ({
    onStatusChange,
    vendorMap,
    onViewProduct: handleViewProduct
  }), [onStatusChange, vendorMap, handleViewProduct]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex justify-start overflow-x-auto">
          <div className="inline-flex rounded-xl bg-gray-100  p-1 border border-gray-200 shadow-sm min-w-max">
            <button
              onClick={() => {
                setActiveTab('rent');
                gridRef.current?.api.deselectAll();
                setSelectedCount(0);
              }}
              className={`group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'rent'
                ? 'bg-white  text-indigo-600  shadow-md ring-1 ring-black/[0.04]'
                : 'text-gray-500 hover:text-gray-800 '
                }`}
            >
              <svg className={`w-3.5 h-3.5 ${activeTab === 'rent' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">RENT</span>
              <span className="sm:hidden">R</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sell');
                gridRef.current?.api.deselectAll();
                setSelectedCount(0);
              }}
              className={`group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'sell'
                ? 'bg-white  text-orange-600  shadow-md ring-1 ring-black/[0.04]'
                : 'text-gray-500 hover:text-gray-800 '
                }`}
            >
              <svg className={`w-3.5 h-3.5 ${activeTab === 'sell' ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden sm:inline">SELL</span>
              <span className="sm:hidden">S</span>
            </button>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex justify-end gap-2 shrink-0">
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
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] rounded-xl">
            <PageLoader fullScreen={false} />
          </div>
        )}
        <div className={`${isDark ? 'ag-theme-alpine-dark cute-ag-grid' : 'ag-theme-alpine cute-ag-grid'} w-full border border-gray-200 overflow-hidden`} style={{ height: "700px" }}>
          <style dangerouslySetInnerHTML={{
            __html: `
          .ag-cell-focus, .ag-cell:focus, .ag-cell-active, .ag-has-focus .ag-cell-focus {
            background-color: transparent !important;
            outline: none !important;
            border: 1px solid transparent !important;
            box-shadow: none !important;
          }
          .ag-row:not(.ag-row-selected) .ag-cell-focus {
            background-color: inherit !important;
          }
        ` }} />
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
            suppressCellFocus={true}
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}