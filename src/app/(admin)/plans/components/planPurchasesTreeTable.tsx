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
import { Trash2 } from "lucide-react";
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
  type: 'vendor' | 'purchase';
  vendorName?: string;
  phone?: string;
  plan_type?: string;
  months?: number;
  days?: number;
  max_products?: number;
  total_slots?: number;
  amount?: number;
  price?: number;
  product_count?: number;
  product_name?: string;
  start_at?: string;
  expire_at?: string;
  start_date?: string;
  expiry_date?: string;
  createdAt?: string;
  originalData?: any;
  children?: TreeDataItem[];
  path?: string[];
}

interface PlanPurchasesTreeTableProps {
  data: any[];
  onDelete: (purchase: any) => void;
  loading?: boolean;
  type: 'listing' | 'priority' | 'booster';
}

// Custom group cell renderer
const PurchaseGroupCellRenderer = (props: ICellRendererParams) => {
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

  // Purchase row
  return (
    <div className="flex items-center gap-2 ml-8">
      <span className="text-sm text-gray-700 font-medium">{data.plan_type || '-'}</span>
    </div>
  );
};

// Action Cell Renderer
const ActionCellRenderer = (props: ICellRendererParams) => {
  const { onDelete } = props.context;
  if (props.data?.type !== 'purchase') return null;

  return (
    <div className="flex items-center justify-center h-full">
      <button
        onClick={() => onDelete(props.data.originalData)}
        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
        title="Delete Purchase"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

const PlanPurchasesTreeTable = React.forwardRef<any, PlanPurchasesTreeTableProps>(({
  data,
  onDelete,
  loading = false,
  type = 'listing',
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

    const vendorGroups: Record<string, any[]> = {};

    data.forEach((p) => {
      const vName = p.vendor_name || 'Unknown Vendor';
      if (!vendorGroups[vName]) vendorGroups[vName] = [];
      vendorGroups[vName].push(p);
    });

    const result: TreeDataItem[] = [];

    Object.entries(vendorGroups).forEach(([vName, purchases]) => {
      const vPath = [vName];
      const first = purchases[0];

      const vendorNode: TreeDataItem = {
        id: vName,
        name: vName,
        type: 'vendor',
        phone: first.vendor_phone,
        path: vPath,
        children: purchases.map((p, pIdx) => {
          const pId = p._id || p.id || `${vName}-${pIdx}`;
          const purchasePath = [...vPath, pId];
          
          const purchaseNode: TreeDataItem = {
            id: pId,
            name: p.plan_name || p.plan_type || 'N/A',
            type: 'purchase',
            plan_type: p.plan_name || p.plan_type,
            months: p.months,
            days: p.days,
            max_products: p.max_products || p.total_slots,
            amount: p.amount || p.price,
            product_count: p.product_ids?.length || (p.product_id ? 1 : 0),
            product_name: p.product_name, // For booster
            start_at: p.start_at || p.start_date,
            expire_at: p.expire_at || p.expiry_date,
            createdAt: p.createdAt,
            originalData: p,
            path: purchasePath,
          };

          // If there are multiple products, add them as children
          if (p.product_ids && Array.isArray(p.product_ids) && p.product_ids.length > 0) {
            purchaseNode.children = p.product_ids.map((prod: any, prodIdx: number) => {
              const prodId = typeof prod === 'string' ? prod : (prod._id || prod.id || `${pId}-${prodIdx}`);
              const prodName = typeof prod === 'object' ? prod.product_name : `Product ID: ${prod}`;
              return {
                id: prodId,
                name: prodName,
                type: 'purchase', // Using 'purchase' type for children to show similar styling or just let it inherit
                product_name: prodName,
                path: [...purchasePath, prodId],
              } as TreeDataItem;
            });
          } else if (p.product_name) {
            // For booster, maybe just one child or no children since it's already shown
          }

          return purchaseNode;
        })
      };

      result.push(vendorNode);
    });

    return result;
  }, [data]);

  const columnDefs: ColDef<TreeDataItem>[] = useMemo(() => [
    {
      headerName: type === 'booster' ? "Duration (Days)" : "Months",
      field: type === 'booster' ? "days" : "months",
      minWidth: 100,
      valueGetter: (p) => p.data?.type === 'purchase' ? (p.data.days || p.data.months || '') : '',
    },
    {
      headerName: type === 'booster' ? "Product Name" : "Max Products",
      field: type === 'booster' ? "product_name" : "max_products",
      minWidth: 150,
      flex: 1.5,
      valueGetter: (p) => p.data?.type === 'purchase' ? (p.data.product_name || p.data.max_products || '') : '',
    },
    {
      headerName: "Amount",
      field: "amount",
      minWidth: 110,
      valueGetter: (p) => p.data?.type === 'purchase' ? p.data.amount : '',
      valueFormatter: (p) => p.value ? `₹${p.value.toLocaleString('en-IN')}` : '',
      cellStyle: { fontWeight: 'bold', color: '#059669' },
    },
    {
      headerName: "Used",
      valueGetter: (p) => p.data?.type === 'purchase' ? `${p.data.product_count} items` : '',
      minWidth: 100,
    },
    {
      headerName: "Start",
      field: "start_at",
      minWidth: 120,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB') : '',
    },
    {
      headerName: "Expire",
      field: "expire_at",
      minWidth: 120,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB') : '',
    },
    {
      headerName: "Created",
      field: "createdAt",
      minWidth: 120,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB') : '',
    },
    {
      headerName: "Action",
      cellRenderer: ActionCellRenderer,
      pinned: "right",
      width: 80,
      minWidth: 80,
      suppressHeaderMenuButton: true,
      sortable: false,
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
  }), []);

  const autoGroupColumnDef: ColDef<TreeDataItem> = useMemo(() => ({
    headerName: "Vendor / Plan Type",
    field: "name",
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: PurchaseGroupCellRenderer,
    },
    minWidth: 350,
    flex: 1.5,
  }), []);

  const getDataPath = useCallback((data: TreeDataItem) => data.path || [data.id], []);
  const getRowId = useCallback((params: any) => `${params.data.type}-${params.data.id}`, []);

  const context = useMemo(() => ({
    onDelete,
  }), [onDelete]);

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
          context={context}
          getDataPath={getDataPath}
          getRowId={getRowId}
          groupDefaultExpanded={0}
          groupDisplayType="singleColumn"
          treeDataChildrenField="children"
          rowHeight={50}
          headerHeight={50}
          getRowStyle={(params) => {
            if (params.data?.type === 'vendor') return { background: '#f8fafc', fontWeight: 'bold' };
            return undefined;
          }}
          overlayNoRowsTemplate="<span class='text-slate-400 font-medium'>No purchases found</span>"
        />
      </div>
    </div>
  );
});

PlanPurchasesTreeTable.displayName = "PlanPurchasesTreeTable";

export default PlanPurchasesTreeTable;
