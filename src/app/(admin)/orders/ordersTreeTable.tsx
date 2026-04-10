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
  RowStyle,
  RowClassParams,
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
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import PageLoader from "@/components/common/PageLoader";

// Register necessary modules
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

interface TreeDataItem {
  id: string;
  name: string;
  type: 'vendor' | 'user' | 'order';
  vendorName?: string;
  userName?: string;
  productName?: string;
  quantity?: number;
  amount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  originalData?: any;
  children?: TreeDataItem[];
  path?: string[];
  phone?: string;
  email?: string;
  categoryName?: string;
  subcategoryName?: string;
}

interface OrdersTreeTableProps {
  data: any[];
  type: 'rent' | 'sell';
  onViewDetails?: (order: any) => void;
  loading?: boolean;
}

// Status cell renderer component
const StatusCellRenderer = (props: ICellRendererParams<TreeDataItem>) => {
  if (props.data?.type !== 'order') return null;
  return (
    <div className="flex items-center h-full">
      <StatusBadge status={props.value || 'pending'} />
    </div>
  );
};

// Amount cell renderer
const AmountRenderer = (params: ICellRendererParams<TreeDataItem>) => {
  if (params.data?.type !== 'order') return null;
  return (
    <div className="flex items-center h-full font-bold text-slate-800">
      ₹{(Number(params.value) || 0).toLocaleString('en-IN')}
    </div>
  );
};

// Payment status cell renderer
const PaymentStatusRenderer = (params: ICellRendererParams<TreeDataItem>) => {
  if (params.data?.type !== 'order') return null;
  return (
    <div className="flex items-center h-full">
      <StatusBadge status={params.value || 'pending'} />
    </div>
  );
};

// Custom group cell renderer
const OrderGroupCellRenderer = (props: ICellRendererParams) => {
  const { data } = props;

  if (data.type === 'vendor') {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
          <span className="text-blue-600 font-bold text-sm">{data.name.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-bold text-slate-800 text-[14px]">{data.name}</span>
          {data.phone && <span className="text-[11px] text-slate-500 font-medium">{data.phone}</span>}
        </div>
      </div>
    );
  }

  if (data.type === 'user') {
    return (
      <div className="flex items-center gap-2 py-1 ml-4">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
          <span className="text-emerald-600 font-bold text-sm">{data.name.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-slate-700 text-[13px]">{data.name}</span>
          {data.phone && <span className="text-[10px] text-slate-400 font-medium">{data.phone}</span>}
        </div>
      </div>
    );
  }

  // Order row
  return (
    <div className="flex items-center gap-2 ml-8">
      <span className="text-sm text-gray-700 font-medium">{data.productName || '-'}</span>
    </div>
  );
};

const OrdersTreeTable = React.forwardRef<any, OrdersTreeTableProps>(({
  data,
  type,
  onViewDetails,
  loading = false,
}, ref) => {
  const gridRef = useRef<AgGridReact>(null);
  const [isDark, setIsDark] = useState(false);

  React.useImperativeHandle(ref, () => ({
    api: gridRef.current?.api,
  }));

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Transform data for tree structure
  const rowData: TreeDataItem[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const vendorGroups: Record<string, any> = {};

    data.forEach((order) => {
      const vName = order.vendor_name || 'Unknown Vendor';
      const uName = order.user_name || 'Unknown User';
      const vId = order.vendor_email || vName; // unique-ish ID for vendor
      const uId = order.user_email || uName;   // unique-ish ID for user

      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          name: vName,
          phone: order.vendor_phone,
          email: order.vendor_email,
          users: {}
        };
      }

      if (!vendorGroups[vId].users[uId]) {
        vendorGroups[vId].users[uId] = {
          name: uName,
          phone: order.user_phone,
          email: order.user_email,
          orders: []
        };
      }

      vendorGroups[vId].users[uId].orders.push(order);
    });

    const result: TreeDataItem[] = [];

    Object.entries(vendorGroups).forEach(([vKey, vendor], vIdx) => {
      const vPath = [vKey];
      const vendorNode: TreeDataItem = {
        id: vKey,
        name: vendor.name,
        type: 'vendor',
        phone: vendor.phone,
        email: vendor.email,
        path: vPath,
        children: []
      };

      Object.entries(vendor.users).forEach(([uKey, user]: [string, any], uIdx) => {
        const uPath = [...vPath, uKey];
        const userNode: TreeDataItem = {
          id: uKey,
          name: user.name,
          type: 'user',
          phone: user.phone,
          email: user.email,
          path: uPath,
          children: []
        };

        user.orders.forEach((order: any, oIdx: number) => {
          const oId = order._id || `${uKey}-${oIdx}`;
          userNode.children?.push({
            id: oId,
            name: order.product_name,
            type: 'order',
            productName: order.product_name,
            quantity: order.qty || order.quantity || 0,
            amount: order.amount || 0,
            status: type === 'rent' ? order.quote_status : order.order_status,
            paymentStatus: order.payment_status,
            createdAt: order.createdAt,
            originalData: order,
            path: [...uPath, oId],
            categoryName: order.category_name,
            subcategoryName: order.subcategory_name,
          });
        });

        vendorNode.children?.push(userNode);
      });

      result.push(vendorNode);
    });

    return result;
  }, [data, type]);

  const columnDefs: ColDef<TreeDataItem>[] = useMemo(() => [
    {
      headerName: "Type",
      field: "originalData.product_listing_type_name",
      valueGetter: (p) => p.data?.type === 'order' ? p.data.originalData?.product_listing_type_name || '' : '',
      hide: type === 'sell',
      minWidth: 100,
    },
    {
      headerName: "Duration",
      valueGetter: (p) => {
        if (p.data?.type !== 'order') return '';
        const val = p.data.originalData?.number_of_days;
        const lType = p.data.originalData?.product_listing_type_name?.toLowerCase();
        if (!val || val <= 0) return '—';
        if (lType === 'hourly') return `${val} Hours`;
        if (lType === 'monthly') return `${val} Months`;
        return `${val} Days`;
      },
      hide: type === 'sell',
      minWidth: 120,
    },
    {
      headerName: "Dates",
      valueGetter: (p) => {
        if (p.data?.type !== 'order') return '';
        const start = p.data.originalData?.start_date;
        const end = p.data.originalData?.end_date;
        if (!start || !end) return '—';
        const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        return `${fmt(start)} - ${fmt(end)}`;
      },
      hide: type === 'sell',
      minWidth: 150,
    },
    {
      headerName: "Category",
      field: "categoryName",
      minWidth: 150,
      cellRenderer: (p: any) => p.data?.type === 'order' ? <span className="font-semibold text-slate-600">{p.value || '—'}</span> : '',
    },
    {
      headerName: "Subcategory",
      field: "subcategoryName",
      minWidth: 150,
      cellRenderer: (p: any) => p.data?.type === 'order' ? <span className="text-slate-500">{p.value || '—'}</span> : '',
    },
    {
      headerName: "Qty",
      field: "quantity",
      minWidth: 80,
    },
    {
      headerName: "Amount",
      field: "amount",
      cellRenderer: AmountRenderer,
      minWidth: 120,
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: StatusCellRenderer,
      minWidth: 140,
    },
    {
      headerName: "Payment",
      field: "paymentStatus",
      cellRenderer: PaymentStatusRenderer,
      minWidth: 140,
    },
    {
      headerName: "Created At",
      field: "createdAt",
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      minWidth: 120,
    }
  ], [type]);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
  }), []);

  const autoGroupColumnDef: ColDef<TreeDataItem> = useMemo(() => ({
    headerName: "Vendor / User / Product",
    field: "name",
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: OrderGroupCellRenderer,
    },
    minWidth: 400,
    flex: 1.5,
  }), []);

  const getDataPath = useCallback((data: TreeDataItem) => data.path || [data.id], []);
  const getRowId = useCallback((params: any) => `${params.data.type}-${params.data.id}`, []);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-[1px]">
          <PageLoader fullScreen={false} />
        </div>
      )}
      <div className={`${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full h-full border border-gray-100 rounded-none overflow-hidden`}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          treeData={true}
          animateRows={true}
          getDataPath={getDataPath}
          getRowId={getRowId}
          groupDefaultExpanded={0}
          groupDisplayType="singleColumn"
          treeDataChildrenField="children"
          rowHeight={50}
          headerHeight={50}
          getRowStyle={(params: RowClassParams<TreeDataItem>) => {
            if (params.data?.type === 'vendor') return { background: '#f8fafc', fontWeight: 'bold' } as RowStyle;
            if (params.data?.type === 'user') return { background: '#ffffff' } as RowStyle;
            return undefined;
          }}
          overlayNoRowsTemplate="<span class='text-slate-400 font-medium'>No orders found</span>"
        />
      </div>
    </div>
  );
});

OrdersTreeTable.displayName = "OrdersTreeTable";

export default OrdersTreeTable;
