"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { VendorPayment, VendorPaymentStats, VendorPaymentTreeData } from "@/types/vendorPayment";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

// Register AG Grid modules
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
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { status: string; vendor_id: string }) => void;
  isReleasing?: string | null;
}

// Status cell renderer
const StatusCellRenderer = (props: ICellRendererParams<VendorPaymentTreeData>) => {
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
  const { onViewDetails, onReleasePayment, onCancelPayment, isReleasing } = props.context;
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

    const handleReleaseClick = () => {
      const confirmed = window.confirm(
        `Are you sure dsyou want to release payment for Order ${data.orderNumber}?\n\n` +
        `Customer: ${data.customerName}\n` +
        `Vendor Amount: ${data.formattedVendorAmount}\n\n` +
        `This action cannot be undone.`
      );
      
      if (confirmed) {
        const notes = window.prompt('Enter release notes (optional):');
        onReleasePayment(data.id, notes || undefined);
      }
    };

    const handleCancelClick = () => {
      const reason = window.prompt(
        `Please enter the reason for cancelling payment for Order ${data.orderNumber}:\n\n` +
        `Customer: ${data.customerName}\n` +
        `Vendor Amount: ${data.formattedVendorAmount}`
      );
      
      if (reason && reason.trim()) {
        const confirmed = window.confirm(
          `Are you sure you want to cancel this payment?\n\n` +
          `Reason: ${reason}\n\n` +
          `This action cannot be undone.`
        );
        
        if (confirmed) {
          onCancelPayment(data.id, reason.trim());
        }
      } else if (reason !== null) {
        alert('Cancellation reason is required.');
      }
    };

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
            onClick={handleReleaseClick}
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
            onClick={handleCancelClick}
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
  const { data } = props;

  if (!data) return null;

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
  onPageChange,
  onFilterChange,
  isReleasing,
}: VendorPaymentTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');

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

  // Column definitions
  const columnDefs: ColDef<VendorPaymentTreeData>[] = useMemo(() => [
    {
      headerName: "Customer",
      field: "customerName",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        return params.data?.type === 'payment' ? params.data.customerName || '' : '';
      },
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: "Order Amount",
      field: "formattedAmount",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        return params.data?.type === 'payment' ? params.data.formattedAmount : '';
      },
      minWidth: 120,
      cellStyle: () => ({ fontWeight: 'bold', color: '#059669', textAlign: 'right' }),
    },
    {
      headerName: "Vendor Amount",
      field: "formattedVendorAmount",
      valueGetter: (params: ValueGetterParams<VendorPaymentTreeData, string>) => {
        return params.data?.type === 'payment' ? params.data.formattedVendorAmount : '';
      },
      minWidth: 140,
      cellStyle: () => ({ fontWeight: 'bold', color: '#7c3aed', textAlign: 'right' }),
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
      minWidth: 120,
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
      minWidth: 120,
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
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            releasedBy === 'admin' 
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
      minWidth: 200,
      maxWidth: 200,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
    }
  ], []);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
    filter: false,
  }), []);

  // Auto group column definition
  const autoGroupColumnDef: ColDef<VendorPaymentTreeData> = useMemo(() => ({
    headerName: "Vendor / Order",
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
  }), [onViewDetails, onReleasePayment, onCancelPayment, isReleasing]);

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
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Vendor Payment Management</h2>
      <p className="text-sm text-slate-600">Manage vendor payments with hierarchical product view</p>
    </div>
  </div>

  {/* Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    <Card className="border-none shadow-lg">
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

    <Card className="border-none shadow-lg">
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

    <Card className="border-none shadow-lg">
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

    <Card className="border-none shadow-lg">
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
  <Card className="border-none shadow-lg">
    <CardContent className="p-3">
      {/* On mobile: stacked layout, on large: side by side */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search and Status Row */}
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* SEARCH INPUT */}
          <input
            type="text"
            placeholder="Search vendors, orders, customers..."
            value={quickFilterText}
            onChange={onQuickFilterChanged}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />

          {/* DROPDOWN */}
          <div className="w-full sm:w-56">
            <SearchableDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => handleStatusFilterChange(val)}
              placeholder="All Status"
              searchable={false}
            />
          </div>
        </div>

        {/* Action Buttons - Side by side on large screens, stacked on mobile */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setQuickFilterText('');
              setStatusFilter('');
              setVendorFilter('');
              onFilterChange({ status: '', vendor_id: '' });
              gridRef.current?.api.setGridOption('quickFilterText', '');
            }}
            className="w-full sm:w-auto h-9 text-sm"
          >
            <Filter size={14} className="mr-2" />
            Clear Filters
          </Button>
          
          <Button
            onClick={onReleaseScheduledPayments}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto h-9 text-sm"
          >
            <RefreshCw size={14} className="mr-2" />
            Release Scheduled
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Tree Table */}
  <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
    <CardContent className="p-0">
      <div className="h-[600px] w-full">
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
            suppressRowClickSelection={true}
            getRowId={getRowId}
            getDataPath={getDataPath}
            groupDefaultExpanded={0}
            groupDisplayType="singleColumn"
            treeDataChildrenField="children"
            quickFilterText={quickFilterText}
            rowHeight={45}
            headerHeight={42}
          />
        </div>
      </div>
    </CardContent>
  </Card>
</div>
  );
}
