// Frontend - app/(admin)/plan-purchases/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Trash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import DatePicker from "@/components/ui/DatePicker";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import { CiFilter } from "react-icons/ci";
import { MdClose, MdSearch } from "react-icons/md";

// Add debounce hook
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type Purchase = {
  _id?: string;
  id?: string;
  vendor_id: string;
  plan_type: string;
  months: number;
  max_products: number;
  amount: number;
  product_ids: string[];
  start_at?: string;
  expire_at?: string;
  createdAt?: string;
  vendor_name?: string;
};

export default function ListingPlanPurchasesPage() {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Purchase[]>([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    plan_type: '',
    amount: '',
    start_month: '', // For purchases starting in this month
    expire_month: '', // For purchases expiring in this month
  });

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  // Options states
  const [planOptions, setPlanOptions] = useState<{ label: string; value: string }[]>([]);
  const [amountOptions, setAmountOptions] = useState<{ label: string; value: string }[]>([]);

  const debouncedSearch = useDebounce(searchText, 600);
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const fetchData = async (filterParams = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add search parameter if exists
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.append('q', debouncedSearch.trim());
      }

      // Add all non-empty filter parameters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== '') {
          if (key === 'amount') {
            params.append('amount', String(Number(value)));
          } else if (key === 'start_month' || key === 'expire_month') {
            // Send month in YYYY-MM format as the backend expects
            params.append(key, value);
          } else {
            params.append(key, String(value));
          }
        }
      });

      const queryString = params.toString();
      const url = queryString
        ? `${endPointApi.getAllListingPlans}?${queryString}`
        : endPointApi.getAllListingPlans;

      console.log("Fetching with URL:", url); // For debugging

      const res = await api.get(url);
      const list = res?.data?.data || [];
      setRows(list);

      // Update plan options from fetched data
      const types = Array.from(new Set((list || []).map((x: any) => x.plan_type).filter(Boolean)));
      setPlanOptions(types.map((t: string) => ({ label: t, value: t })));

      // Update amount options from fetched data (unique amounts)
      const amounts = Array.from(new Set((list || []).map((x: any) => x.amount).filter(Boolean)));
      const sortedAmounts = amounts.sort((a: number, b: number) => a - b);
      setAmountOptions(sortedAmounts.map((amt: number) => ({
        label: `₹${amt}`,
        value: String(amt)
      })));

    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load plan purchases");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters when search debounce or filters change
  useEffect(() => {
    const params: any = {};

    // Add plan filter
    if (filters.plan_type) {
      params.plan_type = filters.plan_type;
    }

    // Add amount (exact)
    if (filters.amount) {
      params.amount = filters.amount;
    }

    // Add start month filter - purchases that started in this month
    if (filters.start_month) {
      // Ensure it's in YYYY-MM format
      const startMonth = filters.start_month.slice(0, 7);
      params.start_month = startMonth;
    }

    // Add expire month filter - purchases that expire in this month
    if (filters.expire_month) {
      // Ensure it's in YYYY-MM format
      const expireMonth = filters.expire_month.slice(0, 7);
      params.expire_month = expireMonth;
    }

    fetchData(params);
  }, [debouncedSearch, filters]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterModalRef.current &&
        !filterModalRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilterModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return;
    const id = purchaseToDelete._id || purchaseToDelete.id;
    if (!id) {
      toast.error("Invalid purchase id");
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`${endPointApi.deleteListingPlan}/${id}`);
      toast.success("Deleted successfully");
      setShowDeletePopup(false);
      setPurchaseToDelete(null);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setPurchaseToDelete(null);
  };

  const deleteOne = async (row: Purchase) => {
    handleDeleteClick(row);
  };

  const deleteSelected = async () => {
    if (!selected.length) {
      toast.info("Select rows to delete");
      return;
    }
    if (!confirm(`Delete ${selected.length} selected purchases?`)) return;
    try {
      for (const r of selected) {
        const id = r._id || r.id;
        if (id) {
          await api.delete(`${endPointApi.deleteListingPlan}/${id}`);
        }
      }
      toast.success("Selected purchases deleted");
      setSelected([]);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      plan_type: '',
      amount: '',
      start_month: '',
      expire_month: '',
    });
    setShowFilterModal(false);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const columns: ColDef[] = [
    { field: "vendor_name", headerName: "Vendor", minWidth: 220 },
    { field: "plan_type", headerName: "Plan", minWidth: 120 },
    { field: "months", headerName: "Months", minWidth: 100 },
    { field: "max_products", headerName: "Max Products", minWidth: 120 },
    { field: "amount", headerName: "Amount", minWidth: 120, valueFormatter: (p) => `₹${p.value}` },
    {
      field: "product_ids",
      headerName: "Products",
      minWidth: 140,
      valueGetter: (p: any) => {
        const count = p.data?.product_ids?.length || 0;
        return count + (count === 1 ? ' item' : ' items');
      }
    },
    {
      field: "start_at",
      headerName: "Start",
      minWidth: 140,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-"
    },
    {
      field: "expire_at",
      headerName: "Expire",
      minWidth: 140,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-"
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 140,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-"
    },
    {
      headerName: "Action",
      minWidth: 120,
      cellRenderer: (params: any) => {
        const row = params.data as Purchase;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
            onClick={() => deleteOne(row)}
            title="Delete"
          >
            <Trash size={16} />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">

        {/* Search and Filter Section */}

      </div>

      <div className="lg:col-span-2">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-end">

            <div className="flex items-center justify-end">
              {/* All three elements at the end */}
              <div className="flex items-center gap-3">
                {/* Delete Selected Button */}
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!selected.length || loading}
                  onClick={deleteSelected}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : null}
                  Delete Selected ({selected.length})
                </Button>

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search purchases..."
                    value={searchText}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                  />
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                {/* Filter Button */}
                <div className="relative">
                  <button
                    ref={filterButtonRef}
                    onClick={() => setShowFilterModal(!showFilterModal)}
                    className="px-4 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 relative text-sm"
                  >
                    <CiFilter size={20} />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Filter Modal */}
                  {showFilterModal && (
                    <div
                      ref={filterModalRef}
                      className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-80 z-50 border border-gray-200"
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-900">Filter Purchases</h3>
                          <button
                            onClick={() => setShowFilterModal(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MdClose size={18} className="text-gray-500" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Plan Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Plan
                            </label>
                            <SearchableDropdown
                              searchable
                              options={planOptions}
                              value={filters.plan_type}
                              placeholder="Select Plan"
                              onChange={(value) => handleFilterChange('plan_type', value)}
                            />
                          </div>

                          {/* Amount Dropdown */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount
                            </label>
                            <SearchableDropdown
                              searchable
                              options={amountOptions}
                              value={filters.amount}
                              placeholder="Select Amount"
                              onChange={(value) => handleFilterChange('amount', value)}
                            />
                          </div>

                          {/* Start Month Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Start Month
                            </label>
                            <DatePicker
                              value={filters.start_month}
                              onChange={(d) => handleFilterChange('start_month', d)}
                              placeholder="Select start month"
                              views={['year', 'month']}
                              format="yyyy-MM"
                            />
                          </div>

                          {/* Expire Month Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expire Month
                            </label>
                            <DatePicker
                              value={filters.expire_month}
                              onChange={(d) => handleFilterChange('expire_month', d)}
                              placeholder="Select expire month"
                              views={['year', 'month']}
                              format="yyyy-MM"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                          <button
                            onClick={clearFilters}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                          >
                            Clear All
                          </button>
                          <button
                            onClick={() => setShowFilterModal(false)}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <AgGridTable
              columns={columns}
              rowData={rows}
              onSelectionChange={(sel: any[]) => setSelected(sel as Purchase[])}
              filter={false}
              tableName="Purchases"
            />
          </CardContent>
        </Card>
      </div>

      <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Purchase?"
        description={purchaseToDelete ? `Are you sure you want to delete this purchase for "${purchaseToDelete.plan_type}" plan? This action cannot be undone.` : "This action cannot be undone."}
        isLoading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}