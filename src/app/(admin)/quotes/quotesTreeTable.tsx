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
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import StatusBadge from "@/components/common/StatusBadge";

// Register only necessary modules
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

interface Quote {
  _id: string;
  user_id?: {
    _id?: string;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    mobile?: string;
    phone?: string;
    email?: string;
  };
  product_id?: {
    _id: string;
    product_name: string;
    vendor_name: string;
    category_name?: string;
    sub_category_name?: string;
    product_type_name?: string;
    deposit_amount?: string | number;
  };
  qty: number;
  calculated_price?: string;
  total_price?: string;
  deposit_amount?: number | string;
  deposit_status?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  payment_status?: string;
  month_name?: string;
  createdAt: string;
}

interface VendorGroup {
  vendorName: string;
  totalQuotes: number;
  quotes: Quote[];
}

interface TreeDataItem {
  id: string;
  name: string;
  type: 'vendor' | 'quote';
  vendorName?: string;
  productName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  quantity?: number;
  price?: number;
  formattedPrice?: string;
  deposit_amount?: number;
  deposit_status?: string;
  status?: string;
  payment_status?: string;
  category_name?: string;
  sub_category_name?: string;
  product_type_name?: string;
  displayDates?: string;
  monthName?: string;
  createdAt?: string;
  originalData?: Quote;
  children?: TreeDataItem[];
  path?: string[];
}

interface QuotesTreeTableProps {
  data: Quote[];
  onViewDetails: (quote: any) => void;
  loading?: boolean;
  onDepositStatusChanged?: (quoteId: string, status: string) => void;
}

// Deposit cell renderer component with interactive status update
const DepositCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.type === 'vendor') return null;

  const quoteId = props.data?.originalData?._id || props.data?.originalData?.id || props.data?._id || props.data?.id;
  const depositAmount = props.data?.deposit_amount ?? 0;
  const initialStatus = props.data?.deposit_status || 'pending';

  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const { onDepositStatusChanged } = props.context || {};

  useEffect(() => {
    setStatus(props.data?.deposit_status || 'pending');
  }, [props.data?.deposit_status]);

  const handleStatusChange = async (newStatus: string) => {
    if (!newStatus || newStatus === status || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await api.post(endPointApi.updateDepositStatus, {
        quote_id: quoteId,
        id: quoteId,
        deposit_status: newStatus,
      });
      if (res?.data?.success || res?.data?.status === 200) {
        setStatus(newStatus);
        if (props.data) {
          props.data.deposit_status = newStatus;
          if (props.data.originalData) {
            props.data.originalData.deposit_status = newStatus;
          }
        }
        toast.success(`Deposit status updated to ${newStatus.toUpperCase()}`);
        if (onDepositStatusChanged) {
          onDepositStatusChanged(quoteId, newStatus);
        }
      } else {
        toast.error(res?.data?.message || 'Failed to update deposit status');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update deposit status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeStyle = (st: string) => {
    const s = String(st || '').toLowerCase();
    switch (s) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:border-emerald-500';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:border-amber-500';
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 h-full py-1"
    >
      <span className="text-xs font-bold text-slate-800 whitespace-nowrap min-w-[32px]">
        ₹{Number(depositAmount).toLocaleString('en-IN')}
      </span>
      <div className="inline-flex items-center">
        <select
          value={status}
          disabled={isUpdating}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`text-xs font-semibold py-1 px-2.5 rounded-md border transition-colors cursor-pointer outline-none ${
            status === 'paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        {isUpdating && <Loader2 size={12} className="ml-1.5 animate-spin text-slate-500" />}
      </div>
    </div>
  );
};

// Status cell renderer component
const StatusCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.type === 'vendor') return null;
  return (
    <div className="flex items-center h-full">
      <StatusBadge status={props.value || 'pending'} />
    </div>
  );
};

// Action cell renderer component
const ActionCellRenderer = (props: ICellRendererParams) => {
  const { onViewDetails } = props.context;

  if (props.data?.type !== 'quote') return null;

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 mt-0.5">
      <button
        onClick={() => onViewDetails(props.data.originalData || props.data)}
        className="p-2 mt-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
        title="View Quote Details"
      >
        <Eye size={14} />
      </button>
    </div>
  );
};

// Custom group cell renderer with vendor info
const VendorGroupCellRenderer = (props: ICellRendererParams) => {
  const { data } = props;

  if (data.type === 'vendor') {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-600 font-semibold text-sm">
            {data.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{data.name}</div>
          <div className="text-xs text-gray-500">{data.quantity} quotes </div>
        </div>
      </div>
    );
  }

  // Quote row - show product name with icon
  return (
    <div className="flex items-center gap-2">

      <span className="text-sm text-gray-700 font-medium">{data.productName || '-'}</span>
    </div>
  );
};

export default function QuotesTreeTable({
  data,
  onViewDetails,
  loading = false,
  onDepositStatusChanged,
}: QuotesTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState('');

  // Format price function
  const formatPrice = (price: number): string => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Transform data for tree structure with path
  const rowData: TreeDataItem[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Grouping by vendor on frontend
    const groups: Record<string, Quote[]> = data.reduce((acc, quote) => {
      const vendorName = quote.product_id?.vendor_name || 'Unknown Vendor';
      if (!acc[vendorName]) acc[vendorName] = [];
      acc[vendorName].push(quote);
      return acc;
    }, {} as Record<string, Quote[]>);

    return Object.entries(groups).map(([vendorName, quotes], vendorIndex) => {
      // Filter out pending quotes (Show everything else like approved, rejected, completed)
      const filteredQuotes = quotes.filter((q: any) => {
        const s = String(q.status || "").toLowerCase();
        return s !== "pending";
      });

      // Only show vendor if they have quotes that are not pending
      if (filteredQuotes.length === 0) return null;

      const vendorPath = [`vendor-${vendorName}-${vendorIndex}`];

      return {
        id: `vendor-${vendorName}-${vendorIndex}`,
        name: vendorName,
        type: 'vendor',
        vendorName: vendorName,
        quantity: filteredQuotes.length,
        path: vendorPath,
        children: filteredQuotes.map((quote: Quote, quoteIndex) => {
          const price = parseFloat(quote.calculated_price || quote.total_price || '0');
          const startDate = quote.start_date ? new Date(quote.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
          const endDate = quote.end_date ? new Date(quote.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
          
          const parseDeposit = (val: any) => {
            if (!val && val !== 0) return 0;
            if (typeof val === 'number') return val;
            const cleaned = String(val).replace(/,/g, '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };

          const rawQuoteDeposit = parseDeposit((quote as any).deposit_amount);
          const rawProductDeposit = parseDeposit((quote.product_id as any)?.deposit_amount);
          const depositAmount = rawQuoteDeposit > 0 ? rawQuoteDeposit : rawProductDeposit;
          const depositStatus = (quote as any).deposit_status || (depositAmount > 0 ? 'pending' : 'not_applicable');

          const customer = typeof quote.user_id === 'object' && quote.user_id !== null ? quote.user_id : null;
          const customerName = customer?.name || customer?.full_name || (customer?.first_name ? `${customer.first_name} ${customer.last_name || ''}`.trim() : '') || '-';
          const customerPhone = customer?.mobile || customer?.phone || '-';
          const customerEmail = customer?.email || '';

          return {
            id: quote._id || `quote-${vendorIndex}-${quoteIndex}`,
            name: quote.product_id?.product_name || 'Unknown Product',
            type: 'quote',
            vendorName: vendorName,
            productName: quote.product_id?.product_name || 'Unknown Product',
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            quantity: quote.qty || 0,
            price: price,
            formattedPrice: formatPrice(price),
            deposit_amount: depositAmount,
            deposit_status: depositStatus,
            status: quote.status || 'pending',
            payment_status: quote.payment_status || 'pending',
            category_name: quote.product_id?.category_name,
            sub_category_name: quote.product_id?.sub_category_name,
            product_type_name: quote.product_id?.product_type_name,
            displayDates: startDate && endDate ? `${startDate} - ${endDate}` : '-',
            monthName: quote.month_name || '-',
            createdAt: quote.createdAt,
            originalData: quote,
            path: [...vendorPath, quote._id || `quote-${vendorIndex}-${quoteIndex}`],
          };
        })
      };
    }).filter(Boolean) as TreeDataItem[];
  }, [data]);

  // Quick filter handler
  const onQuickFilterChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(event.target.value);
    gridRef.current?.api.setGridOption('quickFilterText', event.target.value);
  }, []);

  // Column definitions (keeping existing)
  const columnDefs: ColDef<TreeDataItem>[] = useMemo(() => [
    {
      headerName: "Customer",
      field: "customerName",
      cellRenderer: (params: ICellRendererParams) => {
        if (params.data?.type !== 'quote') return null;
        const name = params.data?.customerName || '-';
        const phone = params.data?.customerPhone;
        return (
          <div className="flex flex-col justify-center h-full py-0.5 leading-tight">
            <span className="text-xs font-semibold text-slate-800 truncate" title={name}>
              {name}
            </span>
            {phone && phone !== '-' && (
              <span className="text-[11px] text-slate-500 font-normal">
                {phone}
              </span>
            )}
          </div>
        );
      },
      minWidth: 160,
    },
    {
      headerName: "Category",
      field: "category_name",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'quote' ? params.data.category_name || '' : '';
      },
      flex: 1,
      cellStyle: () => ({ textAlign: 'left' }),
    },
    {
      headerName: "Sub Category",
      field: "sub_category_name",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'quote' ? params.data.sub_category_name || '' : '';
      },
      flex: 1,
      cellStyle: () => ({ textAlign: 'left' }),
    },
    {
      headerName: "Product Type",
      field: "product_type_name",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'quote' ? params.data.product_type_name || '' : '';
      },
      flex: 1,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      valueGetter: (params: ValueGetterParams<TreeDataItem, number>) => {
        return params.data?.type === 'quote' ? params.data.quantity : undefined;
      },
      minWidth: 100,
      cellStyle: () => ({ textAlign: 'left' }),
    },
    {
      headerName: "Price",
      field: "formattedPrice",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'quote' ? params.data.formattedPrice : '';
      },
      minWidth: 130,
      cellStyle: () => ({ fontWeight: 'bold', color: '#059669', textAlign: 'left' }),
    },
    {
      headerName: "Deposit",
      field: "deposit_amount",
      cellRenderer: DepositCellRenderer,
      minWidth: 175,
    },
    {
      headerName: "Dates",
      field: "displayDates",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'quote' ? params.data.displayDates : '';
      },
      minWidth: 200,
    },
    {
      headerName: "Month",
      field: "monthName",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'quote' ? params.data.monthName : '';
      },
      minWidth: 120,
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: StatusCellRenderer,
      minWidth: 150,
    },
    {
      headerName: "Payment",
      field: "payment_status",
      cellRenderer: StatusCellRenderer,
      minWidth: 150,
    },
    {
      headerName: "Created",
      field: "createdAt",
      valueFormatter: (params: ValueFormatterParams<TreeDataItem, string>) => {
        if (params.data?.type !== 'quote') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
      },
      minWidth: 120,
    },
    {
      headerName: "Action",
      cellRenderer: ActionCellRenderer,
      pinned: "right",
      suppressHeaderMenuButton: true,
      suppressSizeToFit: true,
      minWidth: 100,
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
  const autoGroupColumnDef: ColDef<TreeDataItem> = useMemo(() => ({
    headerName: "Vendor / Product",
    field: "name",
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: VendorGroupCellRenderer,
      checkbox: true,
    },
    flex: 2,
    minWidth: 350,
  }), []);

  // Row selection configuration
  const rowSelection = useMemo<any>(() => ({
    mode: 'multiRow' as const,
    groupSelects: 'descendants' as const,
  }), []);

  // Get data path for tree structure
  const getDataPath = useCallback((data: TreeDataItem) => {
    return data.path || [data.id];
  }, []);

  // Get row ID
  const getRowId = useCallback((params: any) => {
    if (params.data.type === 'vendor') {
      return `vendor-${params.data.id}`;
    }
    return `quote-${params.data.id}`;
  }, []);

  // Context object for cell renderers
  const context = useMemo(() => ({
    onViewDetails,
    onDepositStatusChanged,
  }), [onViewDetails, onDepositStatusChanged]);

  return (
    <div className="space-y-2 h-full flex flex-col relative">
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-transparent">
          {/* We need to import PageLoader if not present */}
          <PageLoader fullScreen={false} />
        </div>
      )}
      <div className="ag-theme-alpine w-full border border-gray-200 overflow-hidden rounded-none flex-1">
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
          quickFilterText={quickFilterText}
          rowHeight={46}
          headerHeight={48}
          overlayNoRowsTemplate="<span></span>"
        />
      </div>
    </div>
  );
}