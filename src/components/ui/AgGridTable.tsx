"use client";
const consoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("AG Grid Enterprise License") ||
      args[0].includes("License Key Not Found") ||
      args[0].includes("unlocked for trial"))
  ) {
    return;
  }
};

import React, { useMemo, useRef, memo, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ColDef, ModuleRegistry, RowSelectionOptions,ColumnMenuTab } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { ColumnMenuModule, ContextMenuModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([AllCommunityModule, ColumnMenuModule, ContextMenuModule]);

interface AgGridTableProps {
  tableName?: string;
  buttonName?: string;
  addButtonLink?: string;
  rowData: any[];
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  columns?: ColDef[];
  filter?: boolean;
  enableSearch?: boolean;
  onSearchChange?: (value: string) => void;
  enableFilter?: boolean;
  renderFilterContent?: () => React.ReactNode;
  activeFilterCount?: number;
  onSelectionChange?: (selected: any[]) => void;
}

const AgGridTable: React.FC<AgGridTableProps> = ({
  buttonName = "",
  addButtonLink = "",
  rowData,
  onDelete,
  onEdit,
  columns,
  enableSearch,
  onSearchChange,
  enableFilter,
  renderFilterContent,
  activeFilterCount,
  onSelectionChange,
}) => {
  const router = useRouter();
  const gridRef = useRef<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);
const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      suppressMenuHide: true,
      menuTabs: ['filterMenuTab'],
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px'
      },
      headerClass: "ag-left-aligned-header",
      cellClass: "ag-cell-with-border",
    }),
    []
  );

  const defaultColumns: ColDef[] = useMemo(
    () => [
      {
        field: "planName",
        headerName: "Plan Name",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true, // Only select filtered rows
        width: 200,
      },
      { field: "price", headerName: "Price", width: 100 },
      { field: "duration", headerName: "Duration", width: 120 },
      { field: "day", headerName: "Day", width: 80 },
      { field: "month", headerName: "Month", width: 100 },
      { field: "rocket", headerName: "Rocket", width: 200 },
      {
        headerName: "Action",
        width: 140,
        suppressSizeToFit: true,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
        cellRenderer: (params: any) => {
          const id = params.data.id;
          return (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row selection when clicking action buttons
                  onEdit ? onEdit(id) : router.push(`/plan/edit/${id}`);
                }}
                className="text-lg text-slate-500 hover:text-brand-600 transition"
                aria-label="Edit"
              >
                <MdModeEdit />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row selection when clicking action buttons
                  onDelete ? onDelete(id) : alert(`Delete clicked for ID: ${id}`);
                }}
                className="text-lg text-slate-400 hover:text-red-500 transition"
                aria-label="Delete"
              >
                <MdDelete />
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, router]
  );

  const rowSelection = useMemo<RowSelectionOptions>(
    () => ({ 
      mode: "multiRow",
      checkboxes: true, // Enable checkboxes for selection
      enableSelectionWithoutKeys: true, // Allow selection without holding Ctrl key
      enableSelectAll: true, // Enable select all
    }),
    []
  );

  const handleAddClick = useCallback(() => {
    router.push(addButtonLink);
  }, [router, addButtonLink]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node) &&
        filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setShowFilterModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection changes
  const onSelectionChanged = useCallback(() => {
    if (gridRef.current && onSelectionChange) {
      const selectedRows = gridRef.current.api.getSelectedRows();
      onSelectionChange(selectedRows);
    }
  }, [onSelectionChange]);

  return (
     <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 dark:text-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          {enableSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); onSearchChange?.(e.target.value); }}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-64"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
          )}
          {enableFilter && (
            <div className="relative">
              <button
                ref={filterButtonRef}
                onClick={() => setShowFilterModal(!showFilterModal)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 relative"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className=""><path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Filter
                {(activeFilterCount || 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              {showFilterModal && (
                <div ref={filterModalRef} className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 z-50 border border-gray-200 dark:border-gray-700">
                  <div className="p-5">
                    {renderFilterContent?.()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {buttonName && (
          <button onClick={handleAddClick} className="btn-primary" aria-label={`Add ${buttonName}`}>
            + Add {buttonName}
          </button>
        )}
      </div>

      <div className={`${isDark ? 'ag-theme-alpine-dark cute-ag-grid' : 'ag-theme-alpine cute-ag-grid'}`} style={{ width: "100%", height: "485px" }}>
        <AgGridReact
          rowHeight={60}
          ref={gridRef}
          rowData={rowData}
          columnDefs={columns || defaultColumns}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={20}
          rowSelection={rowSelection}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          columnMenu="new"
          suppressRowClickSelection={true} // CRITICAL: This prevents row click from toggling selection
          suppressRowDeselection={false} // Allow deselection by clicking checkbox again
          rowMultiSelectWithClick={false} // Don't use click for multi-select
          animateRows
          alwaysShowHorizontalScroll={true}
          onSelectionChanged={onSelectionChanged}
          // Ensure selections persist when data changes
          // immutableData={false}
         getRowId={useCallback((params: any) => {
  // Use id if available, otherwise fall back to categories_id
  return params.data.id || params.data.categories_id || params.data._id;
}, [])}

        />
      </div>
    </div>
  );
};

export default memo(AgGridTable);