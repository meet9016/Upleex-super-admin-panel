"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Plus, Loader2, Layers, Database, Calendar, UserCheck, CheckCircle, X, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import AgGridTable from "@/components/ui/AgGridTable";
import { ColDef } from "ag-grid-community";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import ActionButtons from "@/components/common/ActionButtons";
import { cn } from "@/lib/utils";

type DropdownType = 'products_type' | 'products_listing_type' | 'products_months' | 'account_type' | 'getquote_status';

interface DropdownItem {
  id: string;
  [key: string]: any;
}

interface DropdownConfig {
  key: DropdownType;
  label: string;
  icon: any;
  fieldName: string;
  displayLabel: string;
  placeholder: string;
}

const CONFIGS: DropdownConfig[] = [
  { key: 'products_type', label: 'Product Types', icon: Layers, fieldName: 'product_type', displayLabel: 'Product Type', placeholder: 'e.g. Rent' },
  { key: 'products_listing_type', label: 'Listing Types', icon: Database, fieldName: 'name', displayLabel: 'Listing Type', placeholder: 'e.g. Premium' },
  { key: 'products_months', label: 'Product Months', icon: Calendar, fieldName: 'month_name', displayLabel: 'Month Name', placeholder: 'e.g. 1 Month' },
  { key: 'account_type', label: 'Account Types', icon: UserCheck, fieldName: 'type_name', displayLabel: 'Account Type', placeholder: 'e.g. Manufacturer' },
  { key: 'getquote_status', label: 'Quote Statuses', icon: CheckCircle, fieldName: 'status_name', displayLabel: 'Status Name', placeholder: 'e.g. In Progress' },
];

export default function DropdownsManagementPage() {
  const [activeTab, setActiveTab] = useState<DropdownType>('products_type');
  const [data, setData] = useState<Record<string, DropdownItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<DropdownItem | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [itemToDelete, setItemToDelete] = useState<DropdownItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<DropdownItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const activeConfig = useMemo(() => CONFIGS.find(c => c.key === activeTab)!, [activeTab]);

  const fetchDropdowns = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.get(endPointApi.getDropdowns);
      if (res?.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Fetch dropdowns error:", error);
      toast.error("Failed to fetch dropdown data");
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        [activeTab]: [
          {
            id: editingItem?.id || "",
            [activeConfig.fieldName]: inputValue.trim()
          }
        ]
      };

      const res = await api.put(endPointApi.updateDropdowns, payload);
      if (res?.data?.success) {
        toast.success(editingItem ? `${activeConfig.displayLabel} updated` : `${activeConfig.displayLabel} added`);
        setEditingItem(null);
        setInputValue("");
        setData(res.data);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: DropdownItem) => {
    setEditingItem(item);
    setInputValue(item[activeConfig.fieldName]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setInputValue("");
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const payload: any = {
        [activeTab]: [{ id: itemToDelete.id }]
      };

      const res = await api.delete(endPointApi.deleteDropdowns, { data: payload });
      if (res?.data?.success) {
        toast.success("Deleted successfully");
        if (editingItem?.id === itemToDelete.id) {
            handleCancelEdit();
        }
        setItemToDelete(null);
        setData(res.data);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeleting(true);
    try {
      const payload: any = {
        [activeTab]: selectedRows.map(row => ({ id: row.id }))
      };

      const res = await api.delete(endPointApi.deleteDropdowns, { data: payload });
      if (res?.data?.success) {
        toast.success(`${selectedRows.length} items deleted successfully`);
        setSelectedRows([]);
        setShowBulkDeleteModal(false);
        setData(res.data);
      }
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete selected items");
    } finally {
      setIsDeleting(false);
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: activeConfig.displayLabel,
      field: activeConfig.fieldName,
      flex: 1,
      minWidth: 200,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      cellRenderer: (params: any) => (
        <span className="font-semibold text-slate-900">{params.value}</span>
      )
    },
    {
        headerName: "Created",
        field: "created_at",
        minWidth: 150,
        valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A',
        cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Action",
      width: 100,
      pinned: 'right',
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
      cellRenderer: (params: any) => (
        <ActionButtons 
            onEdit={() => handleEdit(params.data)} 
            onDelete={() => setItemToDelete(params.data)} 
        />
      )
    }
  ], [activeTab, activeConfig, editingItem]);

  const filteredData = useMemo(() => {
    const list = data[activeTab] || [];
    if (!searchText) return list;
    return list.filter(item => 
      String(item[activeConfig.fieldName]).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data, activeTab, activeConfig, searchText]);

  if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dropdowns</h2>
        <p className="text-slate-500">Manage dynamic values for various system dropdowns.</p>
      </div>

      {/* Type Selector (Pill Style Tabs) */}
      <div className="flex flex-wrap gap-2 pb-2">
        {CONFIGS.map((config) => {
          const Icon = config.icon;
          const isActive = activeTab === config.key;
          return (
            <button
              key={config.key}
              onClick={() => {
                setActiveTab(config.key);
                setSearchText("");
                handleCancelEdit();
                setSelectedRows([]);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <Icon size={16} />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-stretch">
        {/* Left: Form Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm h-full flex flex-col" style={{ height: '650px' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {editingItem ? `Edit ${activeConfig.displayLabel}` : `Add New ${activeConfig.displayLabel}`}
              </CardTitle>
              <CardDescription>
                Enter the name for the new entry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {activeConfig.displayLabel} Name
                  </label>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={activeConfig.placeholder}
                    className="h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-xl shadow-lg shadow-blue-200 btn-primary"
                    disabled={submitting || !inputValue.trim()}
                  >
                    {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    {editingItem ? 'Update' : 'Add Entry'}
                  </Button>
                  
                  {editingItem && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Grid Card */}
        <div className="lg:col-span-2">
          <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col h-full" style={{ height: '650px' }}>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{activeConfig.label} List</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {filteredData.length} records
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="destructive"
                    size="md"
                    disabled={selectedRows.length === 0}
                    onClick={() => setShowBulkDeleteModal(true)}
                  >
                    Delete Selected ({selectedRows.length})
                  </Button>
                  <div className="relative">
                    <Input
                      placeholder="Search..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 h-10 w-64 bg-white border-slate-200 rounded-xl text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    {searchText && (
                      <button 
                        onClick={() => setSearchText("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              {isFetching && (
                <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              )}
              <AgGridTable
                rowData={filteredData}
                columns={columnDefs}
                onSelectionChange={(selected) => setSelectedRows(selected)}
                gridHeight={580}
                enableSearch={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <CommonDeleteModal
        open={!!itemToDelete}
        title={`Delete ${activeConfig.displayLabel}?`}
        description={itemToDelete ? `Are you sure you want to delete "${itemToDelete[activeConfig.fieldName]}"?` : ""}
        isLoading={isDeleting}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Confirmation Modal */}
      <CommonDeleteModal
        open={showBulkDeleteModal}
        title={`Delete Selected ${activeConfig.label}?`}
        description={`Are you sure you want to delete ${selectedRows.length} selected entries? This action cannot be undone.`}
        isLoading={isDeleting}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
