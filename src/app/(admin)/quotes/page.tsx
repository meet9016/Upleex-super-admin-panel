'use client';

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Loader2, Search, Eye, Filter, IndianRupee, Clock, CheckCircle, XCircle } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import QuotesTreeTable from "./quotesTreeTable";
import QuoteDetailsModal from "./view";

export default function QuotesPage() {
    const [rowData, setRowData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

    const fetchQuotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(endPointApi.postAllQuotes);
            if (response.data.status === 200 || response.data.success) {
                // Backend returns data grouped by vendor name
                setRowData(response.data.data || {});

                console.log('Total vendors:', response.data.totalVendors);
                console.log('Total quotes:', response.data.totalQuotes);
            }
        } catch (error: any) {
            console.error("Error fetching quotes:", error);
            toast.error("Failed to fetch quotes list");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    const getStatusStyles = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s === 'approved' || s === 'approval' || s === 'active') return "bg-emerald-100 text-emerald-700 border-emerald-200";
        if (s === 'rejected' || s === 'reject') return "bg-rose-100 text-rose-700 border-rose-200";
        if (s === 'completed' || s === 'complete') return "bg-blue-100 text-blue-700 border-blue-200";
        return "bg-amber-100 text-amber-700 border-amber-200";
    };

    const getStatusLabel = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s === 'approved' || s === 'approval' || s === 'active') return "Approved";
        if (s === 'rejected' || s === 'reject') return "Rejected";
        if (s === 'completed' || s === 'complete') return "Completed";
        return "Pending";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-indigo-600 rounded-full"></div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Quotes</h2>
                        <p className="text-sm text-slate-500 font-medium">Manage and review all vendor quote requests and status updates.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <div className="h-[calc(100vh-280px)] w-full relative">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 backdrop-blur-[1px]">
                                    <div className="text-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-slate-600 italic">Fetching quotes data...</p>
                                    </div>
                                </div>
                            ) : Object.keys(rowData).length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center py-20">
                                    <div className="text-center group">
                                        <div className="bg-slate-50 p-6 rounded-full inline-block mb-4 transition-transform group-hover:scale-110 duration-300">
                                            <Search size={48} className="text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No quote requests found at the moment.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <QuotesTreeTable
                                        data={rowData}
                                        onViewDetails={(quote) => {
                                            setSelectedQuote(quote);
                                            setShowDetails(true);
                                        }}
                                    />
                                    {showDetails && selectedQuote && (
                                        <QuoteDetailsModal
                                            open={showDetails}
                                            data={selectedQuote}
                                            onClose={() => { setShowDetails(false); setSelectedQuote(null); }}
                                            onStatusUpdate={fetchQuotes}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
