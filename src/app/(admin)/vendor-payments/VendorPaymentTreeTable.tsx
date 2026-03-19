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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

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

interface VendorPaymentTreeTableProps {
  data: VendorPaymentData[];
  onViewDetails: (data: TreeDataItem | VendorPaymentData) => void;
  onReleasePayment: (vendorId: string, productId?: string) => void;
  isReleasing?: string | null;
}

// Status cell renderer
const StatusCellRenderer = (props: ICellRendererParams<TreeDataItem>) => {
  if (props.data?.type === 'vendor') return null;

  const status = props.value;

  const getStatusStyles = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'released') return "text-green-700 bg-green-50 border-green-200";
    if (s === 'ready_for_release') return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-orange-700 bg-orange-50 border-orange-200";
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'released') return "Released";
    if (s === 'ready_for_release') return "Ready for Release";
    return "Pending";
  };

  const styles = getStatusStyles(status);
  const label = getStatusLabel(status);
  const Icon = label === "Released" ? CheckCircle : label === "Ready for Release" ? Clock : XCircle;

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
const ActionCellRenderer = (props: ICellRendererParams<TreeDataItem>) => {
  const { onViewDetails, onReleasePayment, isReleasing } = props.context;
  const data = props.data;

  if (!data) return null;

  const canReleasePayment = (paymentDate: string) => {
    const paymentTime = new Date(paymentDate).getTime();
    const oneWeekLater = paymentTime + (7 * 24 * 60 * 60 * 1000);
    return Date.now() >= oneWeekLater;
  };

  const isVendor = data.type === 'vendor';
  const isProduct = data.type === 'product';
  
  // For vendor row - show bulk release option
  if (isVendor) {
    const hasReadyProducts = data.children?.some((child: TreeDataItem) => 
      child.paymentStatus === 'ready_for_release' && child.orderDate && canReleasePayment(child.orderDate)
    );

    return (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(data)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
          title="View Vendor Details"
        >
          <Eye size={16} />
        </button>
        {hasReadyProducts && (
          <button
            onClick={() => onReleasePayment(data.id)}
            disabled={isReleasing === data.id}
            className="px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
            title="Release All Ready Payments"
          >
            {isReleasing === data.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <DollarSign size={12} />
            )}
            Release All
          </button>
        )}
      </div>
    );
  }

  // For product row - show individual release option
  if (isProduct) {
    const canRelease = data.paymentStatus === 'ready_for_release' && data.orderDate && canReleasePayment(data.orderDate);

    return (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(data)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
          title="View Product Details"
        >
          <Eye size={16} />
        </button>
        {canRelease && (
          <button
            onClick={() => onReleasePayment(data.vendorName || '', data.id)}
            disabled={isReleasing === data.id}
            className="px-2 py-1.5 text-xs rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
            title="Release Payment"
          >
            {isReleasing === data.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <DollarSign size={12} />
            )}
            Release
          </button>
        )}
      </div>
    );
  }

  return null;
};

// Custom group cell renderer
const VendorGroupCellRenderer = (props: ICellRendererParams<TreeDataItem>) => {
  const { data } = props;

  if (!data) return null;

  if (data.type === 'vendor') {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <User size={20} className="text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{data.businessName}</div>
          <div className="text-xs text-gray-500">
            {data.vendorProductCount} products • ₹{data.vendorTotalAmount?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    );
  }

  // Product row
  return (
    <div className="flex items-center gap-3 ml-4">
      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
        <Package size={16} className="text-blue-600" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-800">{data.productName}</div>
        <div className="text-xs text-gray-500">{data.category} • Qty: {data.quantity}</div>
      </div>
    </div>
  );
};

export default function VendorPaymentTreeTable({
  data,
  onViewDetails,
  onReleasePayment,
  isReleasing,
}: VendorPaymentTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState('');

  // Format amount function
  const formatAmount = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Transform data for tree structure
  const rowData: TreeDataItem[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((vendor, vendorIndex) => {
      const vendorPath = [`vendor-${vendor.vendorId}-${vendorIndex}`];
      const vendorTotalAmount = vendor.products.reduce((sum, product) => sum + product.totalAmount, 0);

      return {
        id: `vendor-${vendor.vendorId}-${vendorIndex}`,
        name: vendor.businessName,
        type: 'vendor' as const,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName,
        vendorTotalAmount: vendorTotalAmount,
        vendorProductCount: vendor.products.length,
        paymentMethod: vendor.paymentMethod,
        transactionId: vendor.transactionId,
        originalData: vendor,
        path: vendorPath,
        children: vendor.products.map((product, productIndex) => ({
          id: `product-${product.productId}-${productIndex}`,
          name: product.productName,
          type: 'product' as const,
          vendorName: vendor.vendorName,
          productName: product.productName,
          productId: product.productId,
          category: product.category,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalAmount: product.totalAmount,
          formattedAmount: formatAmount(product.totalAmount),
          customerName: product.customerName,
          orderDate: product.orderDate,
          deliveryStatus: product.deliveryStatus,
          paymentStatus: product.paymentStatus,
          originalData: product,
          path: [...vendorPath, `product-${product.productId}-${productIndex}`],
        }))
      };
    });
  }, [data]);

  // Quick filter handler
  const onQuickFilterChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(event.target.value);
    gridRef.current?.api.setGridOption('quickFilterText', event.target.value);
  }, []);

  // Column definitions
  const columnDefs: ColDef<TreeDataItem>[] = useMemo(() => [
    {
      headerName: "Category",
      field: "category",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'product' ? params.data.category || '' : '';
      },
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: "Customer",
      field: "customerName",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'product' ? params.data.customerName || '' : '';
      },
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      valueGetter: (params: ValueGetterParams<TreeDataItem, number>) => {
        return params.data?.type === 'product' ? params.data.quantity : undefined;
      },
      minWidth: 100,
      cellStyle: () => ({ textAlign: 'center' }),
    },
    {
      headerName: "Unit Price",
      field: "unitPrice",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'product' ? formatAmount(params.data.unitPrice || 0) : '';
      },
      minWidth: 120,
      cellStyle: () => ({ fontWeight: 'bold', color: '#059669', textAlign: 'right' }),
    },
    {
      headerName: "Total Amount",
      field: "formattedAmount",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'product' ? params.data.formattedAmount : '';
      },
      minWidth: 140,
      cellStyle: () => ({ fontWeight: 'bold', color: '#059669', textAlign: 'right' }),
    },
    {
      headerName: "Order Date",
      field: "orderDate",
      valueFormatter: (params: ValueFormatterParams<TreeDataItem, string>) => {
        if (params.data?.type !== 'product') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }) : '';
      },
      minWidth: 120,
    },
    {
      headerName: "Delivery Status",
      field: "deliveryStatus",
      valueGetter: (params: ValueGetterParams<TreeDataItem, string>) => {
        return params.data?.type === 'product' ? params.data.deliveryStatus || '' : '';
      },
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<TreeDataItem>) => {
        if (params.data?.type !== 'product') return '';
        const status = params.value;
        const isDelivered = status === 'delivered';
        return (
          <div className="flex items-center h-full">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isDelivered 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Payment Status",
      field: "paymentStatus",
      cellRenderer: StatusCellRenderer,
      minWidth: 160,
    },
    {
      headerName: "Action",
      cellRenderer: ActionCellRenderer,
      pinned: "right",
      suppressHeaderMenuButton: true,
      suppressSizeToFit: true,
      minWidth: 150,
      maxWidth: 150,
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
      checkbox: false,
    },
    flex: 2,
    minWidth: 350,
  }), []);

  // Get data path for tree structure
  const getDataPath = useCallback((data: TreeDataItem) => {
    return data.path || [data.id];
  }, []);

  // Get row ID
  const getRowId = useCallback((params: { data: TreeDataItem }) => {
    return params.data.id;
  }, []);

  // Context object for cell renderers
  const context = useMemo(() => ({
    onViewDetails,
    onReleasePayment,
    isReleasing,
  }), [onViewDetails, onReleasePayment, isReleasing]);

  // Calculate summary stats
  const totalVendors = data.length;
  const totalProducts = data.reduce((sum, vendor) => sum + vendor.products.length, 0);
  const totalAmount = data.reduce((sum, vendor) => sum + vendor.totalPaymentAmount, 0);
  const readyForRelease = data.reduce((sum, vendor) => 
    sum + vendor.products.filter(p => p.paymentStatus === 'ready_for_release').length, 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Vendor Payment Management</h2>
          <p className="text-slate-600">Manage vendor payments with hierarchical product view</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Vendors</p>
                <p className="text-2xl font-bold text-slate-900">{totalVendors}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ready for Release</p>
                <p className="text-2xl font-bold text-orange-600">{readyForRelease}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">{formatAmount(totalAmount)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search vendors, products, customers..."
              value={quickFilterText}
              onChange={onQuickFilterChanged}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              variant="outline"
              onClick={() => {
                setQuickFilterText('');
                gridRef.current?.api.setGridOption('quickFilterText', '');
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tree Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[700px] w-full">
            <div className="ag-theme-alpine w-full h-full border-0">
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
                rowHeight={50}
                headerHeight={48}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}