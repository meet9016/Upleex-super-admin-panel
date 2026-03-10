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
  CellStyleModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  RowStyleModule,
  RowSelectionModule,
  QuickFilterModule,
} from "ag-grid-community";
import {
  RowGroupingModule,
  TreeDataModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MasterDetailModule,
  ColumnMenuModule,
  ContextMenuModule,
} from "ag-grid-enterprise";
import { Button } from "./Button";
import { Loader2 } from "lucide-react";
import SearchableDropdown from "./SearchableDropdown";

// Register all required modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
  CellStyleModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  RowStyleModule,
  RowSelectionModule,
  QuickFilterModule,
  RowGroupingModule,
  TreeDataModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MasterDetailModule,
  ColumnMenuModule,
  ContextMenuModule,
]);

interface Product {
  id?: string;
  _id?: string;
  product_name: string;
  category_name: string;
  price: number;
  approval_status: string;
  createdAt: string;
}

interface Vendor {
  _id: string;
  business_name: string;
  full_name: string;
  pendingCount: number;
  products?: Product[];
}

interface TreeDataItem {
  id: string;
  name: string;
  type: 'vendor' | 'product';
  vendorId?: string;
  vendorName?: string;
  full_name?: string;
  category_name?: string;
  price?: number;
  approval_status?: string;
  createdAt?: string;
  pending_count?: number;
  children?: TreeDataItem[];
  path?: string[];
}

interface VendorProductTreeTableProps {
  vendors: Vendor[];
  onBulkApprove: (productIds: string[]) => void;
  onStatusChange: (productId: string, status: string) => void;
  approving: boolean;
}

// Status cell renderer component
const StatusCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.type === 'vendor') return null;
  
  const status = props.value;
  const statusClasses = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700'
  };
  
  return (
    <span className={`text-xs px-2 py-1 rounded ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
      {status}
    </span>
  );
};

// Action cell renderer component
const ActionCellRenderer = (props: ICellRendererParams) => {
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);
  const { onStatusChange } = props.context;

  const handleStatusChange = async (productId: string, status: string) => {
    setUpdatingProduct(productId);
    await onStatusChange(productId, status);
    setUpdatingProduct(null);
  };

  if (props.data?.type !== 'product') return null;

  return (
    <div onClick={(e) => e.stopPropagation()} className="w-40">
      <SearchableDropdown
        options={[
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" }
        ]}
        value={props.data.approval_status}
        onChange={(val) => {
          const status = Array.isArray(val) ? val[0] : val;
          handleStatusChange(props.data.id, status);
        }}
        disabled={updatingProduct === props.data.id}
        placeholder="Select Status"
        usePortal={true}
        maxHeight="max-h-48"
      />
    </div>
  );
};

// Custom group cell renderer with triangle icon and vendor info
const VendorGroupCellRenderer = (props: ICellRendererParams) => {
  const { data, node } = props;
  
  if (data.type === 'vendor') {
    const isExpanded = node.expanded;
    
    return (
      <div className="flex items-center gap-2 py-1">        
        {/* Vendor info */}
        <div className="font-bold">
          <div className="text-sm text-gray-600">{data.full_name || 'N/A'}  - {data.name }</div>
        </div>
        
        {/* Pending count badge */}
        {data.pending_count > 0 && (
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 ml-2">
            {data.pending_count} pending
          </span>
        )}
      </div>
    );
  }
  
  // Product row - show product name with indentation
  return (
    <div className="flex items-center pl-6">
      <span>{props.value}</span>
    </div>
  );
};

export default function VendorProductTreeTable({
  vendors,
  onBulkApprove,
  onStatusChange,
  approving,
}: VendorProductTreeTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [groupSelects, setGroupSelects] = useState<'self' | 'descendants' | 'filteredDescendants'>('descendants');
  const [selectedProductCount, setSelectedProductCount] = useState(0);

  // Transform data for tree structure with path
  const rowData: TreeDataItem[] = useMemo(() => {
    return vendors.map(vendor => {
      // Create vendor path
      const vendorPath = [vendor._id];
      
      return {
        id: vendor._id,
        name: vendor.business_name,
        full_name: vendor.full_name,
        type: 'vendor',
        vendorId: vendor._id,
        pending_count: vendor.pendingCount,
        path: vendorPath,
        children: vendor.products?.map(product => ({
          id: product.id || product._id || '',
          name: product.product_name,
          type: 'product' as const,
          vendorId: vendor._id,
          vendorName: vendor.business_name,
          category_name: product.category_name,
          price: product.price,
          approval_status: product.approval_status,
          createdAt: product.createdAt,
          path: [...vendorPath, product.id || product._id || ''],
        })) || []
      };
    });
  }, [vendors]);

  // Update selected count
  const updateSelectedCount = useCallback(() => {
    if (!gridRef.current?.api) return;
    
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const count = selectedNodes.filter(node => node.data.type === 'product').length;
    setSelectedProductCount(count);
  }, []);

  const handleBulkApproveClick = useCallback(() => {
    if (!gridRef.current?.api) return;
    
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const productIds = selectedNodes
      .filter(node => node.data.type === 'product')
      .map(node => node.data.id);
    
    if (productIds.length > 0) {
      onBulkApprove(productIds);
      // Clear selection after approval
      gridRef.current?.api.deselectAll();
    }
  }, [onBulkApprove]);

  // Handle group selection mode change
  const onGroupSelectsChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as 'self' | 'descendants' | 'filteredDescendants';
    setGroupSelects(value);
    
    // Update row selection configuration
    gridRef.current?.api.setGridOption('rowSelection', {
      mode: 'multiRow',
      groupSelects: value,
    });
  }, []);

  // Quick filter handler
  const onQuickFilterChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    gridRef.current?.api.setGridOption('quickFilterText', event.target.value);
  }, []);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: "Category",
      field: "category_name",
      valueGetter: (params: ValueGetterParams) => {
        return params.data?.type === 'product' ? params.data.category_name : '';
      },
      flex: 1,
    },
    {
      headerName: "Price",
      field: "price",
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? `₹${params.value}` : '';
      },
      flex: 1,
    },
    {
      headerName: "Status",
      field: "approval_status",
      cellRenderer: StatusCellRenderer,
      flex: 1,
    },
    {
      headerName: "Created",
      field: "createdAt",
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      },
      flex: 1,
    },
    {
      headerName: "Action",
      field: "action",
      cellRenderer: ActionCellRenderer,
      suppressSizeToFit: true,
      width: 200,
    }
  ], []);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    // filter: true,
  }), []);

  // Auto group column definition
  const autoGroupColumnDef = useMemo(() => ({
    headerName: "Vendor / Product",
    field: "name" as any,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: VendorGroupCellRenderer,
      checkbox: true,
    },
    flex: 2,
    minWidth: 300,
  }), []);

  // Row selection configuration
  const rowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    groupSelects: groupSelects,
  }), [groupSelects]);

  // Get data path for tree structure
  const getDataPath = useCallback((data: TreeDataItem) => {
    return data.path || [data.id];
  }, []);

  // Get row ID
  const getRowId = useCallback((params: any) => {
    if (params.data.type === 'vendor') {
      return `vendor-${params.data.id}`;
    }
    return `product-${params.data.id}`;
  }, []);

  // Context object for cell renderers
  const context = useMemo(() => ({
    onStatusChange,
  }), [onStatusChange]);

  return (
    <div className="space-y-4">
      {/* Header with quick filter and selection controls */}
      <div className="flex justify-between items-center">
        {selectedProductCount > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                gridRef.current?.api.deselectAll();
                setSelectedProductCount(0);
              }}
              variant="outline"
              className="border-gray-300"
            >
              Clear All ({selectedProductCount})
            </Button>
            <Button
              onClick={handleBulkApproveClick}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700"
            >
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>Approve Selected ({selectedProductCount})</>
              )}
            </Button>
          </div>
        )}
      </div>

    
        <div className="ag-theme-alpine w-full" style={{ height: "750px" }}>
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs} 
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            rowSelection={rowSelection}
            treeData={true}
              pagination
          paginationPageSize={20}
             paginationPageSizeSelector={[10, 20, 50, 100]}
            animateRows={true}
            context={context}
            // domLayout="autoHeight"
            suppressRowClickSelection={true}
            getRowId={getRowId}
            getDataPath={getDataPath}
            groupDefaultExpanded={0}
            groupDisplayType="singleColumn"
            treeDataChildrenField="children"
            groupHideOpenParents={false}
            groupRemoveSingleChildren={false}
            groupRemoveLowestSingleChildren={false}
            alwaysShowHorizontalScroll={true} 
            getRowStyle={(params) => {
              if (params.data?.type === 'vendor') {
                return { background: '#f9fafb' };
              }
              return undefined;
            }}
            onSelectionChanged={updateSelectedCount}
          />
        </div>
    </div>
  );
}