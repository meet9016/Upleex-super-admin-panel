"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { Loader2 } from "lucide-react";

interface ActivityLogRow {
    _id: string;
    admin_id?: { name: string; email: string };
    vendor_id?: { business_name?: string; email?: string; ContactDetails?: { email?: string } };
    actor_type?: string;
    action: string;
    module: string;
    description: string;
    ip_address: string;
    createdAt?: string;
}

export default function ActivityLogsPage() {
    const [rowData, setRowData] = useState<ActivityLogRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(endPointApi.getActivityLogs);
            if (response.data.status === 200 || response.data.success) {
                setRowData(response.data.data || []);
            }
        } catch (error: any) {
            toast.error("Failed to fetch activity logs");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'DELETE': return 'text-red-600 bg-red-50';
            case 'CREATE': return 'text-emerald-600 bg-emerald-50';
            case 'UPDATE': return 'text-amber-600 bg-amber-50';
            case 'LOGIN': return 'text-blue-600 bg-blue-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Activity Logs</h2>
                    <p className="text-sm text-slate-500">Recent system events from Admins and Vendors</p>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
                >
                    Refresh Logs
                </button>
            </div>

            <Card className="border shadow-sm rounded-md overflow-hidden bg-white">
                <CardContent className="p-0 overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading activities...
                        </div>
                    ) : rowData.length === 0 ? (
                        <div className="text-center p-12 text-slate-500 text-sm">
                            No activities found.
                        </div>
                    ) : (
                        <div className="max-h-[750px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap w-[150px]">Date & Time</th>
                                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap w-[200px]">User (Actor)</th>
                                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap w-[100px]">Action</th>
                                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap w-[120px]">Module</th>
                                        <th className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 min-w-[300px]">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rowData.map((row) => {
                                        const isVendor = row.actor_type === 'vendor';
                                        const name = isVendor 
                                            ? (row.vendor_id?.business_name || 'Vendor') 
                                            : (row.admin_id?.name || 'System');
                                        const email = isVendor 
                                            ? (row.vendor_id?.email || row.vendor_id?.ContactDetails?.email || 'N/A')
                                            : (row.admin_id?.email || 'N/A');
                                        
                                        return (
                                        <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-3 py-1.5 text-slate-500 text-xs align-top">
                                                {row.createdAt ? new Date(row.createdAt).toLocaleString(undefined, { 
                                                    year: 'numeric', month: 'short', day: 'numeric', 
                                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                }) : 'N/A'}
                                            </td>
                                            <td className="px-3 py-1.5 align-top">
                                                <div className="font-medium text-slate-900 truncate max-w-[200px]">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] mr-1 ${isVendor ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {isVendor ? 'VENDOR' : 'ADMIN'}
                                                    </span>
                                                    {name}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{email}</div>
                                            </td>
                                            <td className="px-3 py-1.5 align-top">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getActionColor(row.action)}`}>
                                                    {row.action}
                                                </span>
                                            </td>
                                            <td className="px-3 py-1.5 text-slate-700 align-top font-medium">
                                                {row.module}
                                            </td>
                                            <td className="px-3 py-1.5 text-slate-600 align-top leading-snug">
                                                {row.description}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
