'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { Loader2, Search, Eye, Filter, IndianRupee, Clock, CheckCircle, XCircle } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import QuotesTreeTable from "./quotesTreeTable";
import QuoteDetailsModal from "./view";
import PageLoader from "@/components/common/PageLoader";

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalQuotes, setTotalQuotes] = useState(0);

    const fetchQuotes = useCallback(async (pageNum: number, isInitial = false) => {
        if (isInitial) setIsLoading(true);
        else setIsFetchingMore(true);

        try {
            const response = await api.get(`${endPointApi.postAllQuotes}?page=${pageNum}&limit=50`);
            const responseData = response.data;
            
            if (responseData.success || responseData.status === 200) {
                const newQuotes = responseData.data || [];
                setQuotes(prev => isInitial ? newQuotes : [...prev, ...newQuotes]);
                setTotalQuotes(responseData.total || 0);
                
                // Check if we Have more pages
                const totalPages = responseData.totalPages || Math.ceil((responseData.total || 0) / 50);
                setHasMore(pageNum < totalPages);
            }
        } catch (error: any) {
            console.error("Error fetching quotes:", error);
            toast.error("Failed to fetch quotes list");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchQuotes(1, true);
    }, [fetchQuotes]);

    // Intersection Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastQuoteElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    fetchQuotes(nextPage);
                    return nextPage;
                });
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingMore, hasMore, fetchQuotes]);

    const handleRefresh = useCallback(() => {
        setPage(1);
        setHasMore(true);
        fetchQuotes(1, true);
    }, [fetchQuotes]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 ">Vendor Quotes</h2>
                        {/* <p className="text-sm text-slate-500 font-medium">
                            Total {totalQuotes} approved quotes found across all vendors
                        </p> */}
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <div className="h-[calc(100vh-280px)] w-full relative flex flex-col">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <PageLoader fullScreen={false} />
                                </div>
                            ) : quotes.length === 0 ? (
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
                                    <div className="flex-1 min-h-0 overflow-hidden">
                                        <QuotesTreeTable
                                            data={quotes}
                                            onViewDetails={(quote) => {
                                                setSelectedQuote(quote);
                                                setShowDetails(true);
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Infinite Scroll Trigger */}
                                    <div ref={lastQuoteElementRef} className="h-10 flex items-center justify-center py-4">
                                        {isFetchingMore && (
                                            <div className="flex items-center justify-center gap-2 text-indigo-600">
                                                <div className="flex items-center justify-center w-5 h-5">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                </div>
                                                <span className="text-sm font-medium">Loading more quotes...</span>
                                            </div>
                                        )}
                                        {!hasMore && quotes.length > 0 && (
                                            <p className="text-sm text-slate-400 font-medium italic">No more quotes to load</p>
                                        )}
                                    </div>

                                    {showDetails && selectedQuote && (
                                        <QuoteDetailsModal
                                            open={showDetails}
                                            data={selectedQuote}
                                            onClose={() => { setShowDetails(false); setSelectedQuote(null); }}
                                            onStatusUpdate={handleRefresh}
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
