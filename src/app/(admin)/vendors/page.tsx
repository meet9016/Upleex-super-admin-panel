"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Loader2, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface VendorRow {
    _id: string; // This is the KYC ID
    vendor_id: string;
    full_name: string;
    email: string;
    mobile: string;
    business_name: string;
    status: "pending" | "approved" | "rejected";
    created_at?: string;
}

export default function VendorsPage() {
    const [rowData, setRowData] = useState<VendorRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [dropdownStatuses, setDropdownStatuses] = useState<any[]>([]);

    const fetchVendors = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(endPointApi.getVendorList);
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
        fetchVendors();
        fetchDropdowns();
    }, [fetchVendors, fetchDropdowns]);

    const handleStatusChange = async (kycId: string, vendorId: string, newStatus: string) => {
        setIsUpdating(kycId);
        try {
            // Send both kyc_id and vendor_id in payload
            const response = await api.post(endPointApi.updateVendorStatus, {
                kyc_id: kycId,
                vendor_id: vendorId,
                status: newStatus.toLowerCase(),
            });

            if (response.data.status === 200 || response.data.success) {
                toast.success(`Vendor status updated to ${newStatus}`);
                fetchVendors();
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
            flex: 1,
            cellStyle: { fontWeight: "600", color: "#1e293b" }
        },
        {
            headerName: "Business Name",
            valueGetter: p => p.data?.Identity?.business_name || p.data?.business_name || 'N/A',
            flex: 1,
        },
        {
            headerName: "Email",
            valueGetter: p => p.data?.ContactDetails?.email || p.data?.email || 'N/A',
            flex: 1,
        },
        {
            headerName: "Phone",
            valueGetter: p => p.data?.ContactDetails?.mobile || p.data?.mobile || 'N/A',
            width: 130,
        },
        {
            headerName: "KYC Progress",
            width: 150,
            cellRenderer: (params: any) => {
                const completed = params.data.completed_pages?.length || 0;
                const total = 5;
                const percentage = (completed / total) * 100;

                return (
                    <div className="flex flex-col justify-center h-full space-y-1 w-full max-w-[120px]">
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>{completed}/{total} Pages</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
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
            width: 130,
            cellRenderer: (params: any) => {
                const val = params.value?.toLowerCase();
                let colors = "bg-yellow-100 text-yellow-700";
                let Icon = Clock;

                if (val === "approved") {
                    colors = "bg-green-100 text-green-700";
                    Icon = CheckCircle;
                } else if (val === "rejected") {
                    colors = "bg-red-100 text-red-700";
                    Icon = XCircle;
                }

                return (
                    <div className="flex items-center h-full">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors}`}>
                            <Icon size={12} />
                            {params.value || "Pending"}
                        </span>
                    </div>
                );
            }
        },
        {
            headerName: "Action / Update Status",
            width: 180,
            sortable: false,
            filter: false,
            cellRenderer: (params: any) => {
                const kycId = params.data.id;
                const vendorId = params.data.ContactDetails?.vendor_id;

                return (
                    <div className="flex items-center gap-2 h-full">
                        <select
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-1.5 font-medium transition-all"
                            value={params.data.status || "pending"}
                            disabled={isUpdating === kycId}
                            onChange={(e) => handleStatusChange(kycId, vendorId, e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                        </select>
                        {isUpdating === kycId && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Requests</h2>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-xl border-slate-200 text-slate-600 space-x-2"
                        onClick={fetchVendors}
                    >
                        <Clock size={16} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="h-[600px] w-full relative">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 backdrop-blur-[1px]">
                                    <div className="text-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-slate-600 italic">Fetching vendor data...</p>
                                    </div>
                                </div>
                            ) : rowData.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center group">
                                        <div className="bg-slate-50 p-6 rounded-full inline-block mb-4 transition-transform group-hover:scale-110 duration-300">
                                            <Search size={48} className="text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium font-inter">No vendor records found at the moment.</p>
                                    </div>
                                </div>
                            ) : (
                                <DataTable
                                    rowData={rowData}
                                    columnDefs={columnDefs}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}