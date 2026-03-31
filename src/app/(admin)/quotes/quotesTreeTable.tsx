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
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  product_id?: {
    _id: string;
    product_name: string;
    vendor_name: string;
    category_name?: string;
    sub_category_name?: string;
    product_type_name?: string;
  };
  qty: number;
  calculated_price?: string;
  total_price?: string;
  start_date?: string;
  end_date?: string;
  status: string;
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
  quantity?: number;
  price?: number;
  formattedPrice?: string;
  status?: string;
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
}

// Status cell renderer component
const StatusCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.type === 'vendor') return null;

  const status = props.value;

  const getStatusStyles = (status: string) => {
    const s = String(status || '').toLowerCase();
    console.log("🚀 ~ getStatusStyles ~ s:", s)
    if (s == 'approved' || s == 'active' || s == 'approval') return "text-green-700 bg-green-50 border-green-200";
    if (s === 'rejected') return "text-rose-700 bg-rose-50 border-rose-200";
    if (s === 'completed') return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'active' || s === 'approval') return "Approved";
    if (s === 'rejected') return "Rejected";
    if (s === 'completed') return "Completed";
    return "Pending";
  };

  const styles = getStatusStyles(status);
  const label = getStatusLabel(status);
  const Icon = label === "Approved" ? CheckCircle : label === "Rejected" ? XCircle : Clock;

  return (
    <div className="flex items-center h-full">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {/* <Icon size={12} /> */}
        {label}
      </span>
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
        className="p-1.5 mt-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
        title="View Quote Details"
      >
        <Eye size={16} />
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

          return {
            id: quote._id || `quote-${vendorIndex}-${quoteIndex}`,
            name: quote.product_id?.product_name || 'Unknown Product',
            type: 'quote',
            vendorName: vendorName,
            productName: quote.product_id?.product_name || 'Unknown Product',
            quantity: quote.qty || 0,
            price: price,
            formattedPrice: formatPrice(price),
            status: quote.status || 'pending',
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
      minWidth: 150,
      cellStyle: () => ({ fontWeight: 'bold', color: '#059669', textAlign: 'left' }),
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
  }), [onViewDetails]);

  return (
    <div className="space-y-2 h-full flex flex-col">
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
          rowHeight={45}
          headerHeight={48}
        />
      </div>
    </div>
  );
}