"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { Loader2, Search, Eye, X, Filter } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import AgGridTable from "@/components/ui/AgGridTable";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import VendorDetailsModal from "./view";
import Loader from "@/components/common/Loader";
import PageLoader from "@/components/common/PageLoader";

interface VendorRow {
    _id: string; // This is the KYC ID
    vendor_id: string;
    full_name: string;
    email: string;
    mobile: string;
    business_name: string;
    status: "pending" | "approved" | "rejected";
    vendor_type?: "service" | "vendor" | "both";
    created_at?: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function VendorsPage() {
    const [rowData, setRowData] = useState<VendorRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [dropdownStatuses, setDropdownStatuses] = useState<any[]>([]);
    const [showDetails, setShowDetails] = useState(false);
    const [detailsRow, setDetailsRow] = useState<any | null>(null);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [vendorNameFilter, setVendorNameFilter] = useState("");
    const [businessNameFilter, setBusinessNameFilter] = useState("");
    const [kycProgressFilter, setKycProgressFilter] = useState("");

    // Filter Modal state and refs
    const [showFilterModal, setShowFilterModal] = useState(false);
    const filterModalRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const [pendingStatusFilter, setPendingStatusFilter] = useState("");
    const [pendingVendorName, setPendingVendorName] = useState("");
    const [pendingBusinessName, setPendingBusinessName] = useState("");
    const [pendingKycProgress, setPendingKycProgress] = useState("");

    const debouncedSearch = useDebounce(searchText, 500);
    // Only fetch if 3+ chars or empty string
    const validSearchText = debouncedSearch.length >= 3 || debouncedSearch.length === 0 ? debouncedSearch : "";
    const activeFilterCount = [statusFilter, vendorNameFilter, businessNameFilter, kycProgressFilter].filter(v => v !== "").length;

    console.log(rowData)
    const fetchVendors = useCallback(async (
        searchQuery = '',
        statusQuery = '',
        vendorName = '',
        businessName = '',
        kycProgress = ''
    ) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (statusQuery) params.append('status', statusQuery);
            if (vendorName) params.append('vendor_name', vendorName);
            if (businessName) params.append('business_name', businessName);
            if (kycProgress) params.append('kyc_progress', kycProgress);

            const queryString = params.toString();
            const url = queryString ? `${endPointApi.getVendorList}?${queryString}` : endPointApi.getVendorList;

            const response = await api.get(url);
            console.log(response)
            if (response.data.status === 200 || response.data.success) {
                setRowData(response.data.data || []);
            }
        } catch (error: any) {
            console.error("Error fetching vendors:", error);
            toast.error("Failed to fetch vendor list");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDropdowns = useCallback(async () => {
        try {
            const response = await api.get(endPointApi.getDropdowns);
            if (response.data && response.data.getquote_status) {
                setDropdownStatuses(response.data.getquote_status);
            }
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    }, []);

    useEffect(() => {
        // use validSearchText instead of debouncedSearch  
        fetchVendors(validSearchText, statusFilter, vendorNameFilter, businessNameFilter, kycProgressFilter);
    }, [fetchVendors, validSearchText, statusFilter, vendorNameFilter, businessNameFilter, kycProgressFilter]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    // Handle click outside to close filter modal
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

    // if (isLoading && rowData.length === 0) {
    //     return (
    //         <div className="flex items-center justify-center min-h-[900px]">
    //             <PageLoader fullScreen={false} />
    //         </div>
    //     );
    // }

    const handleStatusChange = async (kycId: string, vendorId: string, newStatus: string, rejectionReason?: string) => {
        setIsUpdating(kycId);
        try {
            // Send both kyc_id and vendor_id in payload
            const payload: any = {
                kyc_id: kycId,
                vendor_id: vendorId,
                status: newStatus.toLowerCase(),
            };

            // Add rejection reason if status is rejected
            if (newStatus.toLowerCase() === 'rejected' && rejectionReason) {
                payload.rejection_reason = rejectionReason;
            }

            const response = await api.post(endPointApi.updateVendorStatus, payload);

            if (response.data.status === 200 || response.data.success) {
                toast.success(`Vendor status updated to ${newStatus}`);
                fetchVendors(debouncedSearch, statusFilter, vendorNameFilter, businessNameFilter, kycProgressFilter);
            } else {
                toast.error(response.data.message || "Failed to update status");
            }
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.response?.data?.message || "Failed to update vendor status");
        } finally {
            setIsUpdating(null);
        }
    };

    const columnDefs: ColDef<any>[] = [
        {
            headerName: "Vendor Name",
            valueGetter: p => p.data?.ContactDetails?.full_name || p.data?.full_name || 'N/A',
            minWidth: 250,
            cellStyle: { fontWeight: "600", color: "#1e293b" }
        },
        {
            headerName: "Business Name",
            valueGetter: p => p.data?.Identity?.business_name || p.data?.business_name || 'N/A',
            minWidth: 268,
            cellStyle: { color: "#475569" }
        },
        {
            headerName: "Email",
            valueGetter: p => p.data?.ContactDetails?.email || p.data?.email || 'N/A',
            minWidth: 300,
        },
        {
            headerName: "Phone",
            valueGetter: p => p.data?.ContactDetails?.mobile || p.data?.mobile || 'N/A',
            minWidth: 130,
        },
        {
            headerName: "Vendor Type",
            valueGetter: p => {
                const type = p.data?.vendor_type || 'N/A';
                return type.charAt(0).toUpperCase() + type.slice(1);
            },
            minWidth: 120,
            cellStyle: { color: "#475569" }
        },
        {
            headerName: "KYC Progress",
            minWidth: 200,
            cellRenderer: (params: any) => {
                const completed = params.data.completed_pages?.length || 0;
                const vendorType = params.data.vendor_type;
                const totalSteps = vendorType === 'service' ? 4 : 5;
                const percentage = Math.min((completed / totalSteps) * 100, 100);

                return (
                    <div className="flex flex-col justify-center h-full space-y-1 w-full max-w-[120px]">
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>{completed}/{totalSteps} Pages</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-600' : 'bg-indigo-600'}`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        },
        {
            field: "status",
            headerName: "Current Status",
            width: 150,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full">
                    <StatusBadge status={params.value || 'pending'} />
                </div>
            )
        },
        {
            headerName: "Action",
            width: 200,
            minWidth: 200,
            maxWidth: 200,
            pinned: "right",
            sortable: false,
            filter: false,
            suppressHeaderMenuButton: true,
            cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" },
            cellRenderer: (params: any) => {
                const kycId = params.data.id;
                const vendorId = params.data.ContactDetails?.vendor_id;
                const currentStatus = params.data.status || "pending";

                return (
                    <div className="flex items-center gap-2 h-full">
                        <button
                            type="button"
                            onClick={() => { setDetailsRow(params.data); setShowDetails(true); }}
                            className="p-1.5 mt-1 w-12 flex justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
                            title="View details"
                        >
                            <Eye size={16} className="text-gray-600" />
                        </button>
                        <div className="w-[100%]">
                            <SearchableDropdown
                                options={[
                                    { label: "Pending", value: "pending" },
                                    { label: "Approve", value: "approved" },
                                    { label: "Reject", value: "rejected" }
                                ]}
                                value={currentStatus}
                                onChange={(val) => {
                                    const next = Array.isArray(val) ? val[0] : val;
                                    const completed = params.data.completed_pages?.length || 0;
                                    const vendorType = params.data.vendor_type;
                                    const requiredSteps = vendorType === 'service' ? 2 : 5;

                                    if (next === 'approved' && completed < requiredSteps) {
                                        toast.error(`Complete all ${requiredSteps} pages before approving`);
                                        return;
                                    }

                                    // If rejecting, ask for reason
                                    if (next === 'rejected') {
                                        // const reason = prompt('Please provide a reason for rejection (optional):');
                                        handleStatusChange(kycId, vendorId, next);
                                    } else {
                                        handleStatusChange(kycId, vendorId, next);
                                    }
                                }}
                                disabled={isUpdating === kycId}
                                placeholder="Select Status"
                                usePortal={true}
                                maxHeight="max-h-48"
                                showClear={false}
                                buttonClassName="h-8 py-1"

                            />
                        </div>
                        {isUpdating === kycId && <Loader className="text-indigo-600" />}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Vendor Requests</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        {searchText && (
                            <button
                                onClick={() => setSearchText('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="relative mt-2 sm:mt-0">
                        <button
                            ref={filterButtonRef}
                            onClick={() => {
                                setPendingStatusFilter(statusFilter);
                                setShowFilterModal(!showFilterModal);
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 relative h-[38px] text-sm"
                        >
                            <Filter size={18} />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {showFilterModal && (
                            <div
                                ref={filterModalRef}
                                className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-80 z-50 border border-gray-200"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-gray-900">Filter Vendors</h3>
                                        <button
                                            onClick={() => setShowFilterModal(false)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <X size={18} className="text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 pr-1">
                                        <div>
                                            <label className="block font-semibold mb-2 text-sm text-gray-700">Vendor Name</label>
                                            <input
                                                type="text"
                                                value={pendingVendorName}
                                                onChange={(e) => setPendingVendorName(e.target.value)}
                                                placeholder="Enter vendor name"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-sm text-gray-700">Business Name</label>
                                            <input
                                                type="text"
                                                value={pendingBusinessName}
                                                onChange={(e) => setPendingBusinessName(e.target.value)}
                                                placeholder="Enter business name"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-sm text-gray-700">KYC Progress</label>
                                            <SearchableDropdown
                                                options={[
                                                    { label: "0 Pages", value: "0" },
                                                    { label: "1 Page", value: "1" },
                                                    { label: "2 Pages", value: "2" },
                                                    { label: "3 Pages", value: "3" },
                                                    { label: "4 Pages", value: "4" },
                                                    { label: "Completed (5 Pages)", value: "5" }
                                                ]}
                                                value={pendingKycProgress}
                                                onChange={(val) => setPendingKycProgress(Array.isArray(val) ? val[0] : val)}
                                                placeholder="Select Progress"
                                                maxHeight="max-h-60"
                                                showClear={false}
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-sm text-gray-700">Status</label>
                                            <SearchableDropdown
                                                options={[
                                                    { label: "Pending", value: "pending" },
                                                    { label: "Approved", value: "approved" },
                                                    { label: "Rejected", value: "rejected" }
                                                ]}
                                                value={pendingStatusFilter}
                                                onChange={(val) => setPendingStatusFilter(Array.isArray(val) ? val[0] : val)}
                                                placeholder="Select Status"
                                                maxHeight="max-h-60"
                                                showClear={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setPendingStatusFilter('');
                                                setPendingVendorName('');
                                                setPendingBusinessName('');
                                                setPendingKycProgress('');
                                                setStatusFilter('');
                                                setVendorNameFilter('');
                                                setBusinessNameFilter('');
                                                setKycProgressFilter('');
                                                setShowFilterModal(false);
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            onClick={() => {
                                                setStatusFilter(pendingStatusFilter);
                                                setVendorNameFilter(pendingVendorName);
                                                setBusinessNameFilter(pendingBusinessName);
                                                setKycProgressFilter(pendingKycProgress);
                                                setShowFilterModal(false);
                                            }}
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

            <div className="grid gap-6">
                <Card className="border-none rounded-none shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="h-full w-full relative">
                            {/* {rowData.length === 0 && !isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center group">
                                        <div className="bg-slate-50 p-6 rounded-full inline-block mb-4 transition-transform group-hover:scale-110 duration-300">
                                            <Search size={48} className="text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium font-inter">No vendor records found at the moment.</p>
                                    </div>
                                </div>
                            ) : ( */}
                                <>
                                    <AgGridTable
                                        rowData={rowData}
                                        columns={columnDefs as ColDef<any>[]}
                                        gridHeight={790}
                                        loading={isLoading}
                                        showCheckboxes={false}
                                    />
                                    {showDetails && detailsRow && (
                                        <VendorDetailsModal open={showDetails} data={detailsRow} onClose={() => setShowDetails(false)} />
                                    )}
                                </>
                            {/* )} */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}