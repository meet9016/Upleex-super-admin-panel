"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  ColDef,
  ICellRendererParams,
  RowStyle,
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
  type: 'vendor' | 'purchase' | 'product';
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
  category_name?: string;
  sub_category_name?: string;
  originalData?: any;
  children?: TreeDataItem[];
  path?: string[];
}

interface PlanPurchasesTreeTableProps {
  data: any[];
  onDelete: (purchase: any) => void;
  loading?: boolean;
  type: 'listing' | 'priority' | 'booster' | 'general';
  scope?: 'product' | 'service';
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

  if (data.type === 'purchase') {
    return (
      <div className="flex items-center gap-2 py-1 ml-4">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
          <span className="text-emerald-600 font-bold text-sm">{(data.plan_type || data.name).charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-slate-700 text-[13px]">{data.plan_type || data.name}</span>
          <span className="text-[10px] text-slate-400 font-medium">Plan Details</span>
        </div>
      </div>
    );
  }

  // Product row
  return (
    <div className="flex items-center gap-2 ml-8">
      <span className="text-sm text-gray-700 font-medium">{data.product_name || '-'}</span>
    </div>
  );
};

// ActionCellRenderer strictly removed

const PlanPurchasesTreeTable = React.forwardRef<any, PlanPurchasesTreeTableProps>(({
  data,
  onDelete,
  loading = false,
  type = 'listing',
  scope = 'product',
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

      // For Booster (which has transaction_id), we want to group by transaction_id
      const groupedPurchases: Record<string, any[]> = {};
      purchases.forEach((p, idx) => {
        const groupKey = (type === 'booster' && p.transaction_id) ? p.transaction_id : (p._id || p.id || `idx-${idx}`);
        if (!groupedPurchases[groupKey]) groupedPurchases[groupKey] = [];
        groupedPurchases[groupKey].push(p);
      });

      const vendorNode: TreeDataItem = {
        id: vName,
        name: vName,
        type: 'vendor',
        phone: first.vendor_phone,
        path: vPath,
        children: Object.values(groupedPurchases).map((groupedArr, pIdx) => {
          const p = groupedArr[0];
          const pId = p._id || p.id || `${vName}-${pIdx}`;
          const purchasePath = [...vPath, pId];
          
          let totalAmount = 0;
          let totalPrice = 0;
          let productCount = 0;

          if (type === 'booster' && groupedArr.length > 1) {
             groupedArr.forEach(item => {
                totalAmount += (item.amount || 0);
                totalPrice += (item.price || 0);
             });
             productCount = groupedArr.length;
          } else {
             totalAmount = p.amount;
             totalPrice = p.price;
             const idsArray = scope === 'service' ? p.service_ids : p.product_ids;
             productCount = idsArray?.length || (p.product_id ? 1 : 0);
          }

          const purchaseNode: TreeDataItem = {
            id: pId,
            name: p.plan_name || p.plan_type || `${p.days || '?'}-Day Boost` || 'N/A',
            type: 'purchase',
            plan_type: p.plan_name || p.plan_type || `${p.days || '?'}-Day Boost`,
            months: p.months,
            days: p.days,
            max_products: scope === 'service' ? (p.max_services || p.total_slots || productCount) : (p.max_products || p.total_slots || productCount),
            amount: totalAmount || totalPrice || p.price || p.amount,
            product_count: productCount,
            product_name: scope === 'service' ? p.service_name : p.product_name,
            start_at: p.start_at || p.start_date,
            expire_at: p.expire_at || p.expiry_date,
            createdAt: p.createdAt,
            originalData: p,
            path: purchasePath,
          };

          purchaseNode.children = [];

          if (type === 'booster') {
            groupedArr.forEach((item, itemIdx) => {
                const prod = item.product_id;
                const prodId = typeof prod === 'object' && prod ? (prod._id || prod.id) : (item.product_id || `${pId}-${itemIdx}`);
                const prodName = typeof prod === 'object' && prod ? prod.product_name : (item.product_name || `Product`);
                
                purchaseNode.children!.push({
                    id: String(prodId),
                    name: prodName,
                    type: 'product',
                    product_name: prodName,
                    category_name: typeof prod === 'object' && prod ? prod.category_name : undefined,
                    sub_category_name: typeof prod === 'object' && prod ? prod.sub_category_name : undefined,
                    expire_at: typeof prod === 'object' && prod ? (prod.boost_expiry || prod.expires_at) : (item.expire_at || item.expiry_date),
                    path: [...purchasePath, String(prodId)],
                });
            });
          } else {
            const idsArray = scope === 'service' ? p.service_ids : p.product_ids;
            if (idsArray && Array.isArray(idsArray) && idsArray.length > 0) {
              idsArray.forEach((prod: any, prodIdx: number) => {
                const prodId = typeof prod === 'string' ? prod : (prod._id || prod.id || `${pId}-${prodIdx}`);
                const prodName = typeof prod === 'object' ? (scope === 'service' ? prod.service_name : prod.product_name) : `${scope === 'service' ? 'Service' : 'Product'} ID: ${prodId}`;
                purchaseNode.children!.push({
                  id: prodId,
                  name: prodName,
                  type: 'product',
                  product_name: prodName,
                  category_name: typeof prod === 'object' ? prod.category_name : undefined,
                  sub_category_name: typeof prod === 'object' ? prod.sub_category_name : undefined,
                  expire_at: typeof prod === 'object' ? (prod.expires_at || prod.priority_expiry) : undefined,
                  path: [...purchasePath, String(prodId)],
                } as TreeDataItem);
              });
            }
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
      headerName: type === 'booster' ? (scope === 'service' ? "Service Name" : "Product Name") : (scope === 'service' ? "Max Services" : "Max Products"),
      field: type === 'booster' ? "product_name" : "max_products",
      minWidth: 150,
      flex: 1.5,
      valueGetter: (p) => p.data?.type === 'purchase' ? (p.data.product_name || p.data.max_products || '') : (p.data?.type === 'product' ? p.data.product_name : ''),
    },
    {
      headerName: "Category",
      field: "category_name",
      minWidth: 150,
      cellRenderer: (p: any) => p.data?.type === 'product' ? <span className="font-semibold text-slate-600">{p.value || '—'}</span> : '',
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      minWidth: 150,
      cellRenderer: (p: any) => p.data?.type === 'product' ? <span className="text-slate-500">{p.value || '—'}</span> : '',
    },
    {
      headerName: "Amount",
      field: "amount",
      minWidth: 110,
      valueGetter: (p) => p.data?.type === 'purchase' ? (p.data.amount || p.data.price || 0) : '',
      valueFormatter: (params: any) => params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '',
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
      valueFormatter: (params: any) => {
        if (params.data?.type === 'product') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-GB') : '';
      },
    },
    {
      headerName: "Expire",
      field: "expire_at",
      minWidth: 120,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString('en-GB') : '',
    },
    {
      headerName: "Created",
      field: "createdAt",
      minWidth: 120,
      valueFormatter: (params: any) => {
        if (params.data?.type === 'product') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-GB') : '';
      },
    }
  ], [type]);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
  }), []);

  const autoGroupColumnDef: ColDef<TreeDataItem> = useMemo(() => ({
    headerName: scope === "service" ? "Vendor / Plan / Service" : "Vendor / Plan / Product",
    field: "name",
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: PurchaseGroupCellRenderer,
    },
    minWidth: 400,
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
          getRowStyle={(params): RowStyle | undefined => {
            if (params.data?.type === 'vendor') return { background: '#f8fafc', fontWeight: 'bold' };
            if (params.data?.type === 'purchase') return { background: '#ffffff', fontWeight: 'normal' };
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
