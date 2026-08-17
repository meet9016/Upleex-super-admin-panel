"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  PinnedRowModule,
} from "ag-grid-community";
import {
  RowGroupingModule,
  TreeDataModule,
  SetFilterModule,
  ColumnMenuModule,
  ContextMenuModule,
} from "ag-grid-enterprise";
import {
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Loader2,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { VendorPayment, VendorPaymentStats, VendorPaymentTreeData } from "@/types/vendorPayment";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import PageLoader from "@/components/common/PageLoader";
import ConfirmModal from "@/components/common/ConfirmModal";
import PromptModal from "@/components/common/PromptModal";

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  RowSelectionModule,
  QuickFilterModule,
  PinnedRowModule,
  RowGroupingModule,
  TreeDataModule,
  SetFilterModule,
  ColumnMenuModule,
  ContextMenuModule,
]);

interface ProductPayment {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  orderDate: string;
  deliveryStatus: string;
  paymentStatus: "pending" | "ready_for_release" | "released";
}

interface VendorPaymentData {
  _id: string;
  vendorId: string;
  vendorName: string;
  businessName: string;
  vendorEmail: string;
  vendorPhone: string;
  totalPaymentAmount: number;
  paymentDate: string;
  releaseDate: string;
  paymentMethod: string;
  transactionId: string;
  products: ProductPayment[];
}

interface TreeDataItem {
  id: string;
  name: string;
  type: 'vendor' | 'product';
  vendorName?: string;
  businessName?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  customerName?: string;
  orderDate?: string;
  deliveryStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  formattedAmount?: string;
  originalData?: VendorPaymentData | ProductPayment;
  children?: TreeDataItem[];
  path?: string[];
  vendorTotalAmount?: number;
  vendorProductCount?: number;
}
const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Released", value: "released" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];
interface VendorPaymentTreeTableProps {
  data: VendorPaymentTreeData[];
  stats: VendorPaymentStats | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onViewDetails: (payment: VendorPayment) => void;
  onReleasePayment: (paymentId: string, notes?: string) => void;
  onCancelPayment: (paymentId: string, reason?: string) => void;
  onReleaseScheduledPayments: () => void;
  onReleaseBulkPayments: () => void;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { status: string; vendor_id: string }) => void;
  isReleasing?: string | null;
  loading?: boolean;
  activeTab?: string;
  showCheckboxes?: boolean;
  onSelectionChange?: (selectedRows: VendorPaymentTreeData[]) => void;
  pinnedBottomRowData?: any[];
  onExpandedVendorsChange?: (expandedVendorIds: string[]) => void;
}

// Status cell renderer
const StatusCellRenderer = (props: ICellRendererParams<VendorPaymentTreeData>) => {
  if (props.node?.rowPinned === 'bottom') return null;
  if (props.data?.type === 'vendor') return null;

  const status = props.value;

  const getStatusStyles = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'released') return "text-green-700 bg-green-50 border-green-200";
    if (s === 'pending') return "text-orange-700 bg-orange-50 border-orange-200";
    if (s === 'failed') return "text-red-700 bg-red-50 border-red-200";
    return "text-gray-700 bg-gray-50 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'released') return "Released";
    if (s === 'pending') return "Pending";
    if (s === 'failed') return "Failed";
    if (s === 'cancelled') return "Cancelled";
    return "Unknown";
  };

  const styles = getStatusStyles(status);
  const label = getStatusLabel(status);
  const Icon = label === "Released" ? CheckCircle : label === "Pending" ? Clock : XCircle;

  return (
    <div className="flex items-center h-full">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles}`}>
        <Icon size={12} />
        {label}
      </span>
    </div>
  );
};

// Action cell renderer
const ActionCellRenderer = (props: ICellRendererParams<VendorPaymentTreeData>) => {
  if (props.node?.rowPinned === 'bottom') return null;
  const {
    onViewDetails,
    onReleasePayment,
    onCancelPayment,
    isReleasing,
    activeTab,
    onReleaseClick,
    onCancelClick
  } = props.context;
  const data = props.data;

  if (!data) return null;

  const canReleasePayment = (releaseDate: string) => {
    return new Date() >= new Date(releaseDate);
  };

  const isVendor = data.type === 'vendor';
  const isPayment = data.type === 'payment';

  if (isVendor) {
    return null;
  }

  // For payment row - show individual release/cancel options
  if (isPayment && data.originalData) {
    const canRelease = data.paymentStatus === 'pending';
    const canCancel = data.paymentStatus === 'pending';

    return (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-left gap-2 h-full w-full">
        <button
          onClick={() => onViewDetails(data.originalData)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
          title="View Payment Details"
        >
          <Eye size={14} />
        </button>
        {canRelease && (
          <button
            onClick={() => onReleaseClick(data)}
            disabled={isReleasing === data.id}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
            title="Release Payment"
          >
            {isReleasing === data.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCircle size={12} />
            )}
            Release
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancelClick(data)}
            disabled={isReleasing === data.id}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
            title="Cancel Payment"
          >
            {isReleasing === data.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <XCircle size={12} />
            )}
            Cancel
          </button>
        )}
      </div>
    );
  }

  return null;
};

// Custom group cell renderer
const VendorGroupCellRenderer = (props: ICellRendererParams<VendorPaymentTreeData>) => {
  const { data, node } = props;

  if (!data) return null;

  if (node?.rowPinned === 'bottom') {
    return (
      <div className="flex items-center gap-2 h-full pl-2">
        <span className="text-[11px] font-extrabold tracking-wide text-slate-500 uppercase">∑</span>
        <span className="text-sm font-extrabold text-slate-800">{data.name}</span>
      </div>
    );
  }

  if (data.type === 'vendor') {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <User size={16} className="text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{data.name}</div>
          <div className="text-xs text-gray-500">
            {data.vendorPaymentCount} payments • ₹{data.vendorTotalAmount?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    );
  }

  // Payment row
  return (
    <div className="flex items-center gap-3 ml-4">
      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
        <Package size={16} className="text-blue-600" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-800">{data.orderNumber}</div>
        <div className="text-xs text-gray-500">Customer: {data.customerName}</div>
      </div>
    </div>
  );
};

export default function VendorPaymentTreeTable({
  data,
  stats,
  pagination,
  onViewDetails,
  onReleasePayment,
  onCancelPayment,
  onReleaseScheduledPayments,
  onReleaseBulkPayments,
  onPageChange,
  onFilterChange,
  isReleasing,
  loading = false,
  activeTab = 'sell',
  showCheckboxes = false,
  onSelectionChange,
  pinnedBottomRowData,
  onExpandedVendorsChange,
}: VendorPaymentTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [expandedVendorIds, setExpandedVendorIds] = useState<string[]>([]);

  // Sync pinnedBottomRowData with gridApi whenever it changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption('pinnedBottomRowData', pinnedBottomRowData || []);
    }
  }, [pinnedBottomRowData]);

  const onGridReady = useCallback((params: any) => {
    if (pinnedBottomRowData) {
      params.api.setGridOption('pinnedBottomRowData', pinnedBottomRowData);
    }
  }, [pinnedBottomRowData]);

  // Track row group open/close so parent can recompute the pinned totals
  const onRowGroupOpened = useCallback((event: any) => {
    const vendorId = event.data?.vendorId;
    if (!vendorId) return;
    setExpandedVendorIds(prev => {
      const next = event.expanded
        ? [...prev, vendorId]
        : prev.filter(id => id !== vendorId);
      onExpandedVendorsChange?.(next);
      return next;
    });
  }, [onExpandedVendorsChange]);

  // Modal states for replacing window.confirm and window.prompt
  const [releaseConfirmModal, setReleaseConfirmModal] = useState({ open: false, paymentId: '', orderNumber: '', customerName: '', amount: '', tab: '' });
  const [notesPromptModal, setNotesPromptModal] = useState({ open: false, paymentId: '' });
  const [cancelReasonModal, setCancelReasonModal] = useState({ open: false, paymentId: '', orderNumber: '', customerName: '', amount: '' });
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ open: false, paymentId: '', reason: '' });

  // Format amount function
  const formatAmount = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Transform data for tree structure - data is already in the correct format
  const rowData: VendorPaymentTreeData[] = useMemo(() => {
    return data || [];
  }, [data]);

  // Quick filter handler
  const onQuickFilterChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(event.target.value);
    gridRef.current?.api.setGridOption('quickFilterText', event.target.value);
  }, []);

  // Handle release payment click - opens confirm modal
  const handleReleaseClick = useCallback((paymentData: VendorPaymentTreeData) => {
    setReleaseConfirmModal({
      open: true,
      paymentId: paymentData.id,
      orderNumber: paymentData.orderNumber || '',
      customerName: paymentData.customerName || '',
      amount: paymentData.formattedVendorAmount || '',
      tab: activeTab,
    });
  }, [activeTab]);

  // Handle release confirm - opens notes prompt modal
  const handleReleaseConfirm = useCallback(() => {
    setReleaseConfirmModal(prev => ({ ...prev, open: false }));
    setNotesPromptModal({
      open: true,
      paymentId: releaseConfirmModal.paymentId,
    });
  }, [releaseConfirmModal.paymentId]);

  // Handle notes submit - calls the actual release
  const handleNotesSubmit = useCallback((notes: string) => {
    onReleasePayment(releaseConfirmModal.paymentId, notes || undefined);
    setNotesPromptModal({ open: false, paymentId: '' });
  }, [releaseConfirmModal.paymentId, onReleasePayment]);

  // Handle cancel payment click - opens reason prompt modal
  const handleCancelClick = useCallback((paymentData: VendorPaymentTreeData) => {
    setCancelReasonModal({
      open: true,
      paymentId: paymentData.id,
      orderNumber: paymentData.orderNumber || '',
      customerName: paymentData.customerName || '',
      amount: paymentData.formattedVendorAmount || '',
    });
  }, []);

  // Handle reason submit - opens confirm modal
  const handleReasonSubmit = useCallback((reason: string) => {
    if (!reason.trim()) {
      alert('Cancellation reason is required.');
      return;
    }
    setCancelReasonModal(prev => ({ ...prev, open: false }));
    setCancelConfirmModal({
      open: true,
      paymentId: cancelReasonModal.paymentId,
      reason: reason.trim(),
    });
  }, [cancelReasonModal.paymentId]);

  // Handle cancel confirm - calls the actual cancel
  const handleCancelConfirm = useCallback(() => {
    onCancelPayment(cancelConfirmModal.paymentId, cancelConfirmModal.reason);
    setCancelConfirmModal({ open: false, paymentId: '', reason: '' });
  }, [cancelConfirmModal.paymentId, cancelConfirmModal.reason, onCancelPayment]);

  // Column definitions
  const columnDefs: ColDef<VendorPaymentTreeData>[] = useMemo(() => [
    {
      headerName: "Customer",
      field: "customerName",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        if (params.node?.rowPinned === 'bottom') return '';
        return params.data?.type === 'payment' ? params.data.customerName || '' : '';
      },
      flex: 1,
      minWidth: 150,
    },
    /* {
      headerName: activeTab === 'rent' ? "Quote Amount" : "Order Amount",
      field: "formattedAmount",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        return params.data?.type === 'payment' ? params.data.formattedAmount : '';
      },
      minWidth: 120,
      cellStyle: () => ({ fontWeight: 'bold', color: '#059669', textAlign: 'right' }),
    }, */
    {
      headerName: "Vendor Amount (Excl. GST)",
      field: "formattedVendorBaseAmount",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        if (params.node?.rowPinned === 'bottom') return params.data?.formattedVendorBaseAmount || '';
        return params.data?.type === 'payment' ? params.data.formattedVendorBaseAmount : '';
      },
      minWidth: 215,
      cellStyle: (params) => {
        const isPinned = params.node?.rowPinned === 'bottom';
        return {
          fontWeight: 'bold',
          color: isPinned ? '#0f172a' : '#7c3aed',
          textAlign: 'right' as const
        };
      },
    },
    {
      headerName: "Product GST",
      field: "formattedProductGst",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        if (params.node?.rowPinned === 'bottom') return params.data?.formattedProductGst || '';
        return params.data?.type === 'payment' ? params.data.formattedProductGst : '';
      },
      minWidth: 140,
      cellStyle: (params) => {
        const isPinned = params.node?.rowPinned === 'bottom';
        return {
          fontWeight: isPinned ? 'bold' : 'normal',
          color: isPinned ? '#0f172a' : '#4b5563',
          textAlign: 'right' as const
        };
      },
    },
    {
      headerName: "Vendor Amount (Incl. GST)",
      field: "formattedVendorAmount",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        if (params.node?.rowPinned === 'bottom') return params.data?.formattedVendorAmount || '';
        return params.data?.type === 'payment' ? params.data.formattedVendorAmount : '';
      },
      minWidth: 170,
      cellStyle: (params) => {
        const isPinned = params.node?.rowPinned === 'bottom';
        return {
          fontWeight: 'bold',
          color: isPinned ? '#0f172a' : '#6d28d9',
          textAlign: 'right' as const
        };
      },
    },
    {
      headerName: "Razorpay Fee (Incl. GST)",
      field: "formattedRazorpayTotalCharge",
      minWidth: 200,
      cellStyle: () => ({ textAlign: 'right' as const }),
      cellRenderer: (params: ICellRendererParams<VendorPaymentTreeData>) => {
        // Pinned total row — just bold total
        if (params.node?.rowPinned === 'bottom') {
          return (
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {params.data?.formattedRazorpayTotalCharge || ''}
            </span>
          );
        }
        if (params.data?.type !== 'payment') return null;
        const fee = params.data.razorpayFee ?? 0;
        const gst = params.data.razorpayGst ?? 0;
        const fmt2 = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
            <span style={{ fontWeight: 700, color: '#e11d48' }}>
              {params.data.formattedRazorpayTotalCharge}
            </span>
            <span style={{ fontSize: '10px', color: '#fda4af', whiteSpace: 'nowrap' }}>
              ({fmt2(fee)} + {fmt2(gst)})
            </span>
          </div>
        );
      },
    },
    {
      headerName: "Released Payment",
      field: "formattedAdminNetBalance",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        if (params.node?.rowPinned === 'bottom') return params.data?.formattedAdminNetBalance || '';
        return params.data?.type === 'payment' ? params.data.formattedAdminNetBalance : '';
      },
      minWidth: 160,
      cellStyle: (params) => {
        const isPinned = params.node?.rowPinned === 'bottom';
        const balance = params.data?.adminNetBalance || 0;
        return {
          fontWeight: 'bold',
          color: isPinned ? '#0f172a' : (balance >= 0 ? '#2563eb' : '#dc2626'),
          textAlign: 'right' as const
        };
      },
    },
    {
      headerName: "Delivered Date",
      field: "deliveredAt",
      valueFormatter: (params: ValueFormatterParams<VendorPaymentTreeData, string>) => {
        if (params.data?.type !== 'payment') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : '';
      },
      minWidth: 140,
    },
    {
      headerName: "Release Date",
      field: "releaseDate",
      valueFormatter: (params: ValueFormatterParams<VendorPaymentTreeData, string>) => {
        if (params.data?.type !== 'payment') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : '';
      },
      minWidth: 140,
    },
    {
      headerName: "Payment Status",
      field: "paymentStatus",
      cellRenderer: StatusCellRenderer,
      minWidth: 160,
    },
    {
      headerName: "Released By",
      field: "releasedBy",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        return params.data?.type === 'payment' ? params.data.releasedBy || '-' : '';
      },
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<VendorPaymentTreeData>) => {
        if (params.data?.type !== 'payment') return '';
        const releasedBy = params.value;
        if (!releasedBy || releasedBy === '-') return '-';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${releasedBy === 'admin'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
            }`}>
            {releasedBy === 'admin' ? 'Admin' : 'System'}
          </span>
        );
      }
    },
    {
      headerName: "Action",
      cellRenderer: ActionCellRenderer,
      pinned: "right",
      suppressHeaderMenuButton: true,
      suppressSizeToFit: true,
      minWidth: 250,
      maxWidth: 250,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
    }
  ], [activeTab, onViewDetails, onReleasePayment, onCancelPayment, isReleasing]);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
    filter: false,
  }), []);

  // Row selection configuration
  const rowSelection = useMemo(() => ({
    mode: "multiRow" as const,
    checkboxes: true,
    headerCheckbox: true,
    enableSelectAll: true,
    enableSelectionWithoutKeys: true,
  }), []);

  // Selection column definition
  const selectionColumnDef = useMemo(() => ({
    width: 50,
    maxWidth: 50,
    suppressHeaderMenuButton: true,
    suppressHeaderContextMenu: true,
    pinned: 'left' as const,
    lockPosition: 'left' as const,
    cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    headerClass: 'ag-center-aligned-header',
  }), []);

  // Auto group column definition
  const autoGroupColumnDef: ColDef<VendorPaymentTreeData> = useMemo(() => ({
    headerName: activeTab === 'rent' ? "Vendor / Quote" : "Vendor / Order",
    field: "name",
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: VendorGroupCellRenderer,
      checkbox: false,
    },
    flex: 2,
    minWidth: 350,
  }), []);

  // Get data path for tree structure
  const getDataPath = useCallback((data: VendorPaymentTreeData) => {
    return data.path || [data.id];
  }, []);

  // Get row ID
  const getRowId = useCallback((params: { data: VendorPaymentTreeData }) => {
    return params.data.id;
  }, []);

  // Context object for cell renderers
  const context = useMemo(() => ({
    onViewDetails,
    onReleasePayment,
    onCancelPayment,
    isReleasing,
    activeTab,
    onReleaseClick: handleReleaseClick,
    onCancelClick: handleCancelClick,
  }), [onViewDetails, onReleasePayment, onCancelPayment, isReleasing, activeTab, handleReleaseClick, handleCancelClick]);

  // Handle filter changes
  const handleStatusFilterChange = (status: string | string[]) => {
    const newStatus = Array.isArray(status) ? (status[0] || '') : status;
    setStatusFilter(newStatus);
    onFilterChange({ status: newStatus, vendor_id: vendorFilter });
  };

  const handleVendorFilterChange = (vendorId: string) => {
    setVendorFilter(vendorId);
    onFilterChange({ status: statusFilter, vendor_id: vendorId });
  };

  // Calculate summary stats from props
  const totalVendors = data.length;
  const totalPayments = data.reduce((sum, vendor) => sum + (vendor.vendorPaymentCount || 0), 0);
  const totalAmount = data.reduce((sum, vendor) => sum + (vendor.vendorTotalAmount || 0), 0);
  const pendingPayments = stats?.pending.count || 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Vendor Payment Management</h2>
          {/* <p className="text-sm text-slate-600">Manage vendor payments with hierarchical product view</p> */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-none ">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Total Vendors</p>
                <p className="text-xl font-bold text-slate-900">{totalVendors}</p>
              </div>
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none ">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Total Payments</p>
                <p className="text-xl font-bold text-slate-900">{totalPayments}</p>
              </div>
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none ">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Pending Payments</p>
                <p className="text-xl font-bold text-orange-600">{pendingPayments}</p>
              </div>
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none ">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Total Amount</p>
                <p className="text-xl font-bold text-purple-600">{formatAmount(totalAmount)}</p>
              </div>
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardContent className="p-4">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* LEFT SIDE */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">

              {/* 🔍 SEARCH */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={quickFilterText}
                  onChange={onQuickFilterChanged}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {/* 📂 DROPDOWN */}
              <div className="w-full sm:w-52">
                <SearchableDropdown
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(val) => handleStatusFilterChange(val)}
                  placeholder="All Status"
                  searchable={false}
                />
              </div>
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-2">

              {/* CLEAR */}
              <button
                onClick={() => {
                  setQuickFilterText('');
                  setStatusFilter('');
                  setVendorFilter('');
                  onFilterChange({ status: '', vendor_id: '' });
                  gridRef.current?.api.setGridOption('quickFilterText', '');
                }}
                className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Filter size={14} />
                Clear
              </button>

              {/* PRIMARY ACTION */}
              <button
                onClick={() => {
                  const selectedNodes = gridRef.current?.api.getSelectedNodes();
                  const paymentIds = selectedNodes
                    ?.filter(node => node.data?.type === 'payment' && node.data?.paymentStatus === 'pending')
                    .map(node => node.data.id) || [];

                  if (paymentIds.length > 0) {
                    onReleaseBulkPayments();
                  } else {
                    onReleaseScheduledPayments();
                  }
                }}
                className="px-4 py-2.5 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
              >
                <RefreshCw size={14} />
                {(() => {
                  const selectedRows = gridRef.current?.api.getSelectedRows() || [];
                  const pendingPaymentsCount = selectedRows.filter(row => row.type === 'payment' && row.paymentStatus === 'pending').length;
                  return pendingPaymentsCount > 0 ? `Release Selected (${pendingPaymentsCount})` : 'Release Scheduled';
                })()}
              </button>

            </div>
          </div>

        </CardContent>
      </Card>
      {/* Tree Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[600px] w-full relative">
            {loading && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-transparent">
                <PageLoader fullScreen={false} />
              </div>
            )}
            <div className="ag-theme-alpine w-full h-full border-0 cute-ag-grid">
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                autoGroupColumnDef={autoGroupColumnDef}
                treeData={true}
                animateRows={true}
                context={context}
                pinnedBottomRowData={pinnedBottomRowData}
                onGridReady={onGridReady}
                onRowGroupOpened={onRowGroupOpened}
                suppressRowClickSelection={true}
                getRowId={getRowId}
                getDataPath={getDataPath}
                groupDefaultExpanded={0}
                groupDisplayType="singleColumn"
                treeDataChildrenField="children"
                quickFilterText={quickFilterText}
                rowHeight={45}
                headerHeight={42}
                getRowStyle={(params) => {
                  if (params.node?.rowPinned === 'bottom') {
                    return {
                      background: '#eef2ff',
                      borderTop: '2px solid #c7d2fe',
                      fontWeight: '700',
                    };
                  }
                  return undefined;
                }}
                overlayNoRowsTemplate="<span></span>"
                rowSelection={showCheckboxes ? rowSelection : undefined}
                selectionColumnDef={showCheckboxes ? selectionColumnDef : undefined}
                onSelectionChanged={() => {
                  if (showCheckboxes && onSelectionChange) {
                    const selectedRows = gridRef.current?.api?.getSelectedRows() || [];
                    onSelectionChange(selectedRows);
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Release Payment Confirmation Modal */}
      <ConfirmModal
        open={releaseConfirmModal.open}
        title={`Release ${releaseConfirmModal.tab === 'rent' ? 'Quote' : 'Order'} Payment?`}
        description={`Are you sure you want to release payment for ${releaseConfirmModal.tab === 'rent' ? 'Quote' : 'Order'} ${releaseConfirmModal.orderNumber}?\n\nCustomer: ${releaseConfirmModal.customerName}\nVendor Amount: ${releaseConfirmModal.amount}\n\nThis action cannot be undone.`}
        confirmText="Release"
        cancelText="Cancel"
        onCancel={() => setReleaseConfirmModal({ open: false, paymentId: '', orderNumber: '', customerName: '', amount: '', tab: '' })}
        onConfirm={handleReleaseConfirm}
      />

      {/* Release Notes Prompt Modal */}
      <PromptModal
        open={notesPromptModal.open}
        title="Release Notes"
        description="Add any notes for this payment release (optional)"
        placeholder="Enter release notes..."
        confirmText="Release"
        cancelText="Cancel"
        multiline={true}
        onCancel={() => setNotesPromptModal({ open: false, paymentId: '' })}
        onConfirm={handleNotesSubmit}
      />

      {/* Cancel Payment Reason Prompt Modal */}
      <PromptModal
        open={cancelReasonModal.open}
        title="Cancel Payment"
        description={`Please enter the reason for cancelling payment for Order ${cancelReasonModal.orderNumber}:\n\nCustomer: ${cancelReasonModal.customerName}\nVendor Amount: ${cancelReasonModal.amount}`}
        placeholder="Enter cancellation reason..."
        confirmText="Next"
        cancelText="Cancel"
        required={true}
        multiline={true}
        onCancel={() => setCancelReasonModal({ open: false, paymentId: '', orderNumber: '', customerName: '', amount: '' })}
        onConfirm={handleReasonSubmit}
      />

      {/* Cancel Payment Confirmation Modal */}
      <ConfirmModal
        open={cancelConfirmModal.open}
        title="Confirm Payment Cancellation"
        description={`Are you sure you want to cancel this payment?\n\nReason: ${cancelConfirmModal.reason}\n\nThis action cannot be undone.`}
        confirmText="Yes, Cancel Payment"
        cancelText="Go Back"
        isDangerous={true}
        onCancel={() => setCancelConfirmModal({ open: false, paymentId: '', reason: '' })}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
