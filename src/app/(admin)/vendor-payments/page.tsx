"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import Loader from "@/components/common/Loader";
import VendorPaymentDetailsModal from "./VendorPaymentDetailsModal";
import VendorPaymentTreeTable from "./VendorPaymentTreeTable";
import { apiService } from "@/services/api";
import { VendorPayment, VendorPaymentStats, VendorPaymentTreeData, VendorPaymentResponse, VendorPaymentStatsResponse, ReleasePaymentResponse, SafeOrderInfo } from "@/types/vendorPayment";
import PageLoader from "@/components/common/PageLoader";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ShoppingBag, FileText } from "lucide-react";

export default function VendorPaymentsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const activeTab = searchParams.get('type') || 'sell';

    const [payments, setPayments] = useState<VendorPayment[]>([]);
    const [stats, setStats] = useState<VendorPaymentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<VendorPayment | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        vendor_id: ''
    });
    const [selectedRows, setSelectedRows] = useState<VendorPaymentTreeData[]>([]);

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', tab);
        params.set('page', '1'); // Reset to first page when changing tabs
        router.push(`${pathname}?${params.toString()}`);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const fetchVendorPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response: VendorPaymentResponse = await apiService.getAllVendorPayments({
                page: pagination.page,
                limit: pagination.limit,
                type: activeTab,
                ...filters
            });
            
            if (response && response.success) {
                setPayments(response.data?.payments || []);
                setPagination(response.data?.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0
                });
            } else {
                setPayments([]);
                toast.error(response?.message || "Failed to fetch vendor payments");
            }
        } catch (error: any) {
            setPayments([]);
            if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
                toast.error("Authentication failed. Please login again.");
                // Redirect to login or refresh token
            } else {
                toast.error(error.message || "Failed to fetch vendor payments");
            }
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, filters, activeTab]);

    const fetchPaymentStats = useCallback(async () => {
        try {
            const response: VendorPaymentStatsResponse = await apiService.getVendorPaymentStats(undefined, activeTab);
            if (response && response.success) {
                setStats(response.data?.stats || null);
            } else {
                setStats(null);
            }
        } catch (error: any) {
            setStats(null);
            // Don't show error toast for stats as it's not critical
        }
    }, [activeTab]);

    useEffect(() => {
        fetchVendorPayments();
        fetchPaymentStats();
    }, [fetchVendorPayments, fetchPaymentStats]);

    const handleReleasePayment = async (paymentId: string, notes?: string) => {
        setIsReleasing(paymentId);
        
        try {
            const response: ReleasePaymentResponse = await apiService.releasePayment(paymentId, notes);
            
            if (response && response.success) {
                toast.success("Payment released successfully");
                // Update the payment in the list
                setPayments(prev => 
                    prev.map(payment => 
                        payment._id === paymentId
                            ? { ...payment, payment_status: 'released', released_at: new Date().toISOString(), released_by: 'admin' }
                            : payment
                    )
                );
                // Refresh stats
                fetchPaymentStats();
            } else {
                toast.error(response?.message || "Failed to release payment");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to release payment");
        } finally {
            setIsReleasing(null);
        }
    };

    const handleCancelPayment = async (paymentId: string, reason?: string) => {
        setIsReleasing(paymentId);
        
        try {
            const response: ReleasePaymentResponse = await apiService.cancelPayment(paymentId, reason);
            
            if (response && response.success) {
                toast.success("Payment cancelled successfully");
                // Update the payment in the list
                setPayments(prev => 
                    prev.map(payment => 
                        payment._id === paymentId
                            ? { ...payment, payment_status: 'cancelled', notes: reason || 'Cancelled by admin' }
                            : payment
                    )
                );
                // Refresh stats
                fetchPaymentStats();
            } else {
                toast.error(response?.message || "Failed to cancel payment");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel payment");
        } finally {
            setIsReleasing(null);
        }
    };

    const handleReleaseScheduledPayments = async () => {
        try {
            const response: ReleasePaymentResponse = await apiService.releaseScheduledPayments();
            if (response && response.success) {
                toast.success(`Released ${response.data?.releasedCount || 0} scheduled payments`);
                fetchVendorPayments();
                fetchPaymentStats();
            } else {
                toast.error(response?.message || "Failed to release scheduled payments");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to release scheduled payments");
        }
    };

    const handleReleaseBulkPayments = async () => {
        const paymentIds = selectedRows
            .filter(row => row.type === 'payment' && row.paymentStatus === 'pending')
            .map(row => row.id);

        if (paymentIds.length === 0) {
            toast.info("No pending payments selected");
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiService.releaseBulkPayments(paymentIds);
            if (response && response.success) {
                toast.success(response.message || `Successfully released ${paymentIds.length} payments`);
                fetchVendorPayments();
                fetchPaymentStats();
                setSelectedRows([]); // Clear selection after release
            } else {
                toast.error(response?.message || "Failed to release payments");
            }
        } catch (error: any) {
            console.error("Error in bulk release:", error);
            toast.error(error.message || "Failed to release payments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (payment: VendorPayment) => {
        setSelectedPayment(payment);
        setShowDetailsModal(true);
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    // Transform payments data for tree table
    const transformedData: VendorPaymentTreeData[] = React.useMemo(() => {
        if (!payments || payments.length === 0) return [];
        
        const vendorGroups: { [key: string]: VendorPayment[] } = {};
        
        // Group payments by vendor_id
        payments.forEach(payment => {
            // Skip if payment has neither order_id nor quote_id
            if (!payment || (!payment.order_id && !payment.quote_id)) {
                console.warn('Skipping payment with missing order_id and quote_id:', payment);
                return;
            }
            
            if (!vendorGroups[payment.vendor_id]) {
                vendorGroups[payment.vendor_id] = [];
            }
            vendorGroups[payment.vendor_id].push(payment);
        });

        return Object.entries(vendorGroups).map(([vendorId, vendorPayments]) => {
            const totalAmount = vendorPayments.reduce((sum, p) => sum + (p.vendor_amount || 0), 0);
            const firstPayment = vendorPayments[0];
            const vendorName = firstPayment?.vendor_info?.business_name || firstPayment?.vendor_info?.full_name || `Vendor ${vendorId}`;
            
            return {
                id: `vendor-${vendorId}`,
                name: vendorName,
                type: 'vendor' as const,
                vendorId,
                vendorTotalAmount: totalAmount,
                vendorPaymentCount: vendorPayments.length,
                path: [`vendor-${vendorId}`],
                children: vendorPayments.map(payment => {
                    // Additional safety checks with proper typing
                    const defaultOrderInfo: SafeOrderInfo = {
                        order_id: 'N/A',
                        user_name: 'Unknown Customer',
                        total_amount: 0
                    };
                    
                    const orderInfo: SafeOrderInfo = payment.order_id ? {
                        order_id: payment.order_id.order_id || 'N/A',
                        user_name: payment.order_id.user_name || 'Unknown Customer',
                        total_amount: payment.order_id.total_amount || 0
                    } : payment.quote_id ? {
                        order_id: `Q#${payment.quote_id._id.slice(-6).toUpperCase()}`,
                        user_name: payment.quote_id.user_id?.name || payment.quote_id.user_id?.first_name || 'Unknown Customer',
                        total_amount: payment.quote_id.calculated_price || 0
                    } : defaultOrderInfo;
                    
                    const orderId = orderInfo.order_id;
                    const userName = orderInfo.user_name;
                    const totalAmount = orderInfo.total_amount;
                    
                    return {
                        id: payment._id,
                        name: orderId,
                        type: 'payment' as const,
                        vendorId: payment.vendor_id,
                        vendorName: vendorName,
                        orderNumber: orderId,
                        customerName: userName,
                        totalAmount: totalAmount,
                        vendorAmount: payment.vendor_amount || 0,
                        paymentStatus: payment.payment_status,
                        deliveredAt: payment.delivered_at,
                        releaseDate: payment.release_date,
                        releasedAt: payment.released_at,
                        releasedBy: payment.released_by,
                        notes: payment.notes,
                        formattedAmount: `₹${totalAmount.toLocaleString('en-IN')}`,
                        formattedVendorAmount: `₹${(payment.vendor_amount || 0).toLocaleString('en-IN')}`,
                        originalData: payment,
                        path: [`vendor-${vendorId}`, payment._id]
                    };
                })
            };
        });
    }, [payments]);

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            {/* Tabs Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                <button
                    onClick={() => handleTabChange('sell')}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        activeTab === 'sell'
                            ? "bg-white text-indigo-600 shadow-md shadow-indigo-100 ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                >
                    <ShoppingBag size={16} className={activeTab === 'sell' ? "text-indigo-600" : "text-slate-400"} />
                    Sell
                </button>
                <button
                    onClick={() => handleTabChange('rent')}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        activeTab === 'rent'
                            ? "bg-white text-indigo-600 shadow-md shadow-indigo-100 ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                >
                    <FileText size={16} className={activeTab === 'rent' ? "text-indigo-600" : "text-slate-400"} />
                    Rent
                </button>
            </div>

            <VendorPaymentTreeTable
                data={transformedData}
                stats={stats}
                pagination={pagination}
                onViewDetails={handleViewDetails}
                onReleasePayment={handleReleasePayment}
                onCancelPayment={handleCancelPayment}
                onReleaseScheduledPayments={handleReleaseScheduledPayments}
                onReleaseBulkPayments={handleReleaseBulkPayments}
                onPageChange={handlePageChange}
                onFilterChange={handleFilterChange}
                isReleasing={isReleasing}
                loading={isLoading}
                activeTab={activeTab}
                showCheckboxes={true}
                onSelectionChange={(rows) => setSelectedRows(rows)}
            />

            {/* Vendor Payment Details Modal */}
            <VendorPaymentDetailsModal
                open={showDetailsModal}
                data={selectedPayment}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedPayment(null);
                }}
                onReleasePayment={(paymentId, notes) => handleReleasePayment(paymentId, notes)}
                isReleasing={isReleasing === selectedPayment?._id}
            />
        </div>
    );
}
