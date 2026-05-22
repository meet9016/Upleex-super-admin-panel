"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ColDef } from "ag-grid-community";
import PlanPurchasesTreeTable from "./planPurchasesTreeTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import DatePicker from "@/components/ui/DatePicker";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import { CiFilter } from "react-icons/ci";
import { MdClose, MdSearch } from "react-icons/md";
import PageLoader from "@/components/common/PageLoader";
import { 
  exportAllPlansToExcel, 
  exportAllPlansToPDF,
  exportListingPurchasesToExcel,
  exportListingPurchasesToPDF,
  exportPriorityPurchasesToExcel,
  exportPriorityPurchasesToPDF,
  exportRentalBoostPurchasesToExcel,
  exportRentalBoostPurchasesToPDF
} from "@/utils/exportUtils";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FileJson, FileText } from "lucide-react";

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

export default function PlanPurchasesTab() {
  const [activeSubTab, setActiveSubTab] = useState<'listing' | 'priority' | 'booster'>('listing');
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Purchase[]>([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [allPlansExcelLoading, setAllPlansExcelLoading] = useState(false);
  const [allPlansPdfLoading, setAllPlansPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showAllPlansMenu, setShowAllPlansMenu] = useState(false);
  const gridRef = useRef<any>(null);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);
  const allPlansMenuRef = React.useRef<HTMLDivElement>(null);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [tempFilters, setTempFilters] = useState({
    plan_type: "",
    amount: "",
    start_month: "",
    expire_month: "",
  });

  // Applied filters (only changes when Apply button is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    plan_type: "",
    amount: "",
    start_month: "",
    expire_month: "",
  });

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  // Options states - store all available options
  const [allPlanOptions, setAllPlanOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [allAmountOptions, setAllAmountOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const debouncedSearch = useDebounce(searchText, 600);
  const activeFilterCount = Object.values(appliedFilters).filter(
    (v) => v !== ""
  ).length;

  // Fetch all available filter options on component mount
  const fetchFilterOptions = async () => {
    try {
      const res = await api.get(endPointApi.getAllListingPlans);
      const list = res?.data?.data || [];

      const types = Array.from(
        new Set((list || []).map((x: any) => x.plan_type).filter(Boolean))
      ) as string[];
      setAllPlanOptions(types.map((t: string) => ({ label: t, value: t })));

      const amounts = Array.from(
        new Set((list || []).map((x: any) => x.amount).filter(Boolean))
      ) as number[];
      const sortedAmounts = amounts.sort((a: number, b: number) => a - b);
      setAllAmountOptions(
        sortedAmounts.map((amt: number) => ({
          label: `₹${amt}`,
          value: String(amt),
        }))
      );
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchData = async (filterParams = {}, searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchTerm && searchTerm.trim() !== "") {
        params.append("q", searchTerm.trim());
      }

      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== "") {
          if (key === "amount") {
            params.append("amount", String(Number(value)));
          } else if (key === "start_month" || key === "expire_month") {
            const v = String(value);
            const monthPart = v.length >= 7 ? v.slice(0, 7) : v; // YYYY-MM from YYYY-MM-DD
            params.append(key, monthPart);
          } else {
            params.append(key, String(value));
          }
        }
      });

      const queryString = params.toString();
      let url = "";
      if (activeSubTab === 'listing') {
        url = endPointApi.getAllListingPlans;
      } else if (activeSubTab === 'priority') {
        url = endPointApi.getAllPriorityPurchases;
      } else if (activeSubTab === 'booster') {
        url = endPointApi.getAllRentalBoostPurchases;
      }

      const res = await api.get(queryString ? `${url}?${queryString}` : url);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Failed to load plan purchases"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 3 || debouncedSearch.length === 0) {
      fetchData(appliedFilters, debouncedSearch);
    }
  }, [debouncedSearch, appliedFilters, activeSubTab]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
      if (allPlansMenuRef.current && !allPlansMenuRef.current.contains(event.target as Node)) {
        setShowAllPlansMenu(false);
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
      fetchData(appliedFilters, debouncedSearch);
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
      gridRef.current?.api?.deselectAll();
      fetchData(appliedFilters, debouncedSearch);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  const getCurrentParams = () => {
    const params: any = {};
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.q = debouncedSearch.trim();
    }
    if (appliedFilters.plan_type && appliedFilters.plan_type.trim() !== '') {
      params.plan_type = appliedFilters.plan_type.trim();
    }
    if (appliedFilters.amount && appliedFilters.amount.trim() !== '') {
      params.amount = Number(appliedFilters.amount);
    }
    if (appliedFilters.start_month && appliedFilters.start_month.trim() !== '') {
      const v = String(appliedFilters.start_month);
      const monthPart = v.length >= 7 ? v.slice(0, 7) : v;
      params.start_month = monthPart;
    }
    if (appliedFilters.expire_month && appliedFilters.expire_month.trim() !== '') {
      const v = String(appliedFilters.expire_month);
      const monthPart = v.length >= 7 ? v.slice(0, 7) : v;
      params.expire_month = monthPart;
    }
    return params;
  };

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = getCurrentParams();
      
      let exportFunc = exportAllPlansToExcel;
      let successMsg = 'All plan purchases exported to Excel successfully!';
      
      if (activeSubTab === 'listing') {
        exportFunc = exportListingPurchasesToExcel;
        successMsg = 'Product listing plan purchases exported to Excel successfully!';
      } else if (activeSubTab === 'priority') {
        exportFunc = exportPriorityPurchasesToExcel;
        successMsg = 'Priority plan purchases exported to Excel successfully!';
      } else if (activeSubTab === 'booster') {
        exportFunc = exportRentalBoostPurchasesToExcel;
        successMsg = 'Rental boost plan purchases exported to Excel successfully!';
      }
      
      await exportFunc(params);
      toast.success(successMsg);
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const params = getCurrentParams();
      
      let exportFunc = exportAllPlansToPDF;
      let successMsg = 'All plan purchases exported to PDF successfully!';
      
      if (activeSubTab === 'listing') {
        exportFunc = exportListingPurchasesToPDF;
        successMsg = 'Product listing plan purchases exported to PDF successfully!';
      } else if (activeSubTab === 'priority') {
        exportFunc = exportPriorityPurchasesToPDF;
        successMsg = 'Priority plan purchases exported to PDF successfully!';
      } else if (activeSubTab === 'booster') {
        exportFunc = exportRentalBoostPurchasesToPDF;
        successMsg = 'Rental boost plan purchases exported to PDF successfully!';
      }
      
      await exportFunc(params);
      toast.success(successMsg);
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportAllPlansExcel = async () => {
    try {
      setAllPlansExcelLoading(true);
      await exportAllPlansToExcel();
      toast.success('All plan purchases exported to Excel successfully!');
      setShowAllPlansMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to Excel');
    } finally {
      setAllPlansExcelLoading(false);
    }
  };

  const handleExportAllPlansPDF = async () => {
    try {
      setAllPlansPdfLoading(true);
      await exportAllPlansToPDF();
      toast.success('All plan purchases exported to PDF successfully!');
      setShowAllPlansMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to PDF');
    } finally {
      setAllPlansPdfLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setTempFilters({
      plan_type: "",
      amount: "",
      start_month: "",
      expire_month: "",
    });
    setAppliedFilters({
      plan_type: "",
      amount: "",
      start_month: "",
      expire_month: "",
    });
    setShowFilterModal(false);
  };

  const columns: ColDef[] = [
    {
      field: "vendor_name",
      headerName: "Vendor",
      rowGroup: true,
      hide: true,
      valueGetter: (p: any) => p.data?.vendor_name || "Unknown Vendor",
    },
    {
      field: "vendor_phone",
      headerName: "Phone",
      hide: true,
      valueGetter: (p: any) => p.data?.vendor_phone || "",
    },
    {
      field: "plan_type",
      headerName: "Plan",
      minWidth: 200,
      resizable: false,
      flex: 2,
    },
    { field: "months", headerName: "Months", minWidth: 100, resizable: false },
    {
      field: "max_products",
      headerName: "Max Products",
      minWidth: 150,
      resizable: false,
    },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 100,
      resizable: false,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      field: "product_ids",
      headerName: "Products",
      minWidth: 150,
      resizable: false,
      valueGetter: (p: any) => {
        const count = p.data?.product_ids?.length || 0;
        return count + (count === 1 ? " item" : " items");
      },
    },
    {
      field: "start_at",
      headerName: "Start",
      minWidth: 150,
      resizable: false,
      valueFormatter: (p) =>
        p.value
          ? new Date(p.value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          : "-",
    },
    {
      field: "expire_at",
      headerName: "Expire",
      minWidth: 150,
      resizable: false,
      valueFormatter: (p) =>
        p.value
          ? new Date(p.value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          : "-",
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 150,
      resizable: false,
      valueFormatter: (p) =>
        p.value
          ? new Date(p.value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          : "-",
    },
    {
      headerName: "Action",
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      pinned: "right",
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8px",
      },
      cellRenderer: (params: any) => (
        <ActionButtons
          showEdit={false}
          onDelete={() => handleDeleteClick(params.data)}
        />
      ),
    },
  ];


  return (
    <div className="space-y-6">
      <div className="flex items-center bg-gray-100/80 rounded-xl p-1 gap-1 w-fit">
        <button
          onClick={() => setActiveSubTab('listing')}
          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'listing'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/[0.04]'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          Product Listing Plan
        </button>
        <button
          onClick={() => setActiveSubTab('priority')}
          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'priority'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/[0.04]'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          Priority Plan
        </button>
        <button
          onClick={() => setActiveSubTab('booster')}
          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'booster'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/[0.04]'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          Rental Boost Plan
        </button>

        {/* All Plans Export Menu */}
        <div className="relative ml-2" ref={allPlansMenuRef}>
          <button
            onClick={() => setShowAllPlansMenu((v) => !v)}
            className="w-10 h-10 flex items-center justify-center bg-white text-gray-500 border border-gray-300 rounded-xl hover:shadow-md hover:text-gray-600 transition-all duration-300"
            title="Export all plans options"
          >
            <BsThreeDotsVertical size={18} />
          </button>

          {showAllPlansMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-64 z-50 border border-gray-200 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={handleExportAllPlansExcel}
                  disabled={allPlansExcelLoading || allPlansPdfLoading}
                  className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                >
                  <FileJson className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                  <span>Export All Plans to Excel</span>
                  {allPlansExcelLoading && <Loader2 className="ml-auto text-emerald-600 w-3.5 h-3.5 animate-spin" />}
                </button>

                <button
                  onClick={handleExportAllPlansPDF}
                  disabled={allPlansExcelLoading || allPlansPdfLoading}
                  className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50"
                >
                  <FileText className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                  <span>Export All Plans to PDF</span>
                  {allPlansPdfLoading && <Loader2 className="ml-auto text-rose-600 w-3.5 h-3.5 animate-spin" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card className="border-slate-200">

        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-64 text-sm"
              />
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button
                size="md"
                variant="destructive"
                disabled={!selected.length}
                onClick={deleteSelected}
                className="text-sm"
              >
                Delete Selected ({selected.length})
              </Button>
              
              {/* Filter Button */}
              <div className="relative">
                <button
                  ref={filterButtonRef}
                  onClick={() => setShowFilterModal(!showFilterModal)}
                  className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 text-sm relative"
                >
                  <CiFilter size={20} /> Filter
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {showFilterModal && (
                  <div
                    ref={filterModalRef}
                    className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-80 z-50 border p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Filter Purchases
                      </h3>
                      <button
                        onClick={() => setShowFilterModal(false)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MdClose size={18} className="text-gray-500" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Plan
                        </label>
                        <SearchableDropdown
                          searchable
                          options={allPlanOptions}
                          value={tempFilters.plan_type}
                          placeholder="Select Plan"
                          onChange={(val) =>
                            setTempFilters({
                              ...tempFilters,
                              plan_type: val as string,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <SearchableDropdown
                          searchable
                          options={allAmountOptions}
                          value={tempFilters.amount}
                          placeholder="Select Amount"
                          onChange={(val) =>
                            setTempFilters({
                              ...tempFilters,
                              amount: val as string,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Month
                        </label>
                        <DatePicker
                          value={tempFilters.start_month}
                          onChange={(d) =>
                            setTempFilters({ ...tempFilters, start_month: d })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expire Month
                        </label>
                        <DatePicker
                          value={tempFilters.expire_month}
                          onChange={(d) =>
                            setTempFilters({ ...tempFilters, expire_month: d })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={clearFilters}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={applyFilters}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions Menu (Export) */}
              <div className="relative" ref={actionsMenuRef}>
                <button
                  onClick={() => setShowActionsMenu((v) => !v)}
                  className="w-full sm:w-10 h-10 flex items-center justify-center bg-white text-gray-500 border border-gray-300 rounded-xl hover:shadow-md hover:text-gray-600 transition-all duration-300"
                  title="Export options"
                >
                  <BsThreeDotsVertical size={18} />
                </button>

                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-64 z-50 border border-gray-200 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={handleExportExcel}
                        disabled={excelLoading || pdfLoading}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                      >
                        <FileJson className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                        <span>Export to Excel</span>
                        {excelLoading && <Loader2 className="ml-auto text-emerald-600 w-3.5 h-3.5 animate-spin" />}
                      </button>

                      <button
                        onClick={handleExportPDF}
                        disabled={excelLoading || pdfLoading}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50"
                      >
                        <FileText className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                        <span>Export to PDF</span>
                        {pdfLoading && <Loader2 className="ml-auto text-rose-600 w-3.5 h-3.5 animate-spin" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[750px] w-full relative">
            <PlanPurchasesTreeTable
              ref={gridRef}
              data={rows}
              loading={loading}
              onDelete={handleDeleteClick}
              type={activeSubTab}
            />
          </div>
        </CardContent>
      </Card>
      <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Purchase?"
        description={
          purchaseToDelete
            ? `Are you sure you want to delete this purchase for "${purchaseToDelete.plan_type}" plan? This action cannot be undone.`
            : "This action cannot be undone."
        }
        isLoading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
