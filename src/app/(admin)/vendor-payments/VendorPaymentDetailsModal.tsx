"use client";

import React, { useState } from "react";
import { X, Calendar, DollarSign, Package, User, CreditCard, Hash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VendorPayment, SafeOrderInfo } from "@/types/vendorPayment";

interface VendorPaymentDetailsModalProps {
    open: boolean;
    data: VendorPayment | null;
    onClose: () => void;
    onReleasePayment?: (paymentId: string, notes?: string) => void;
    isReleasing?: boolean;
}

const VendorPaymentDetailsModal: React.FC<VendorPaymentDetailsModalProps> = ({
    open,
    data,
    onClose,
    onReleasePayment,
    isReleasing = false
}) => {
    const [notes, setNotes] = useState('');
    
    if (!open || !data) return null;

    // Safety check for order_id with proper typing
    const defaultOrderInfo: SafeOrderInfo = {
        order_id: 'N/A',
        user_name: 'Unknown Customer',
        total_amount: 0
    };
    
    const orderInfo: SafeOrderInfo = data.order_id ? {
        order_id: data.order_id.order_id || 'N/A',
        user_name: data.order_id.user_name || 'Unknown Customer',
        total_amount: data.order_id.total_amount || 0
    } : defaultOrderInfo;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { color: "bg-orange-100 text-orange-800 border-orange-200", text: "Pending" },
            released: { color: "bg-green-100 text-green-800 border-green-200", text: "Released" },
            failed: { color: "bg-red-100 text-red-800 border-red-200", text: "Failed" },
            cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", text: "Cancelled" }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const canReleasePayment = () => {
        return data.payment_status === 'pending' && new Date() >= new Date(data.release_date);
    };

    const handleReleasePayment = () => {
        if (onReleasePayment) {
            onReleasePayment(data._id, notes.trim() || undefined);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                            <p className="text-gray-600">Order: <span className="font-semibold">{orderInfo.order_id}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {getPaymentStatusBadge(data.payment_status)}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Order Amount</p>
                                            <p className="text-2xl font-bold text-gray-900">{formatAmount(orderInfo.total_amount)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Vendor Amount</p>
                                            <p className="text-2xl font-bold text-green-600">{formatAmount(data.vendor_amount)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <User className="h-8 w-8 text-purple-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Customer</p>
                                            <p className="text-lg font-bold text-gray-900">{orderInfo.user_name}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Order Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        Order Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Order ID</label>
                                        <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{orderInfo.order_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Customer Name</label>
                                        <p className="text-gray-900 font-semibold">{orderInfo.user_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Total Order Amount</label>
                                        <p className="text-gray-900 font-bold text-lg">{formatAmount(orderInfo.total_amount)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Vendor ID</label>
                                        <p className="text-gray-900 font-mono text-sm">{data.vendor_id}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-purple-600" />
                                        Payment Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Delivered At</label>
                                        <p className="text-gray-900">{formatDate(data.delivered_at)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Release Date</label>
                                        <p className="text-gray-900">{formatDate(data.release_date)}</p>
                                    </div>
                                    {data.released_at && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Released At</label>
                                            <p className="text-gray-900">{formatDate(data.released_at)}</p>
                                        </div>
                                    )}
                                    {data.released_by && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Released By</label>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                data.released_by === 'admin' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {data.released_by === 'admin' ? 'Admin' : 'System'}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Payment Status</label>
                                        <div className="mt-1">
                                            {getPaymentStatusBadge(data.payment_status)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Notes Section */}
                        {(data.notes || canReleasePayment()) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Hash className="h-5 w-5 text-indigo-600" />
                                        Notes & Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {data.notes && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Existing Notes</label>
                                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{data.notes}</p>
                                        </div>
                                    )}
                                    {canReleasePayment() && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Release Notes (Optional)</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add notes for manual release..."
                                                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Vendor Payment Amount: <span className="text-2xl font-bold text-green-600 ml-2">{formatAmount(data.vendor_amount)}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            {canReleasePayment() && (
                                <Button 
                                    onClick={handleReleasePayment}
                                    disabled={isReleasing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isReleasing ? (
                                        <>
                                            <Loader2 size={16} className="mr-2 animate-spin" />
                                            Releasing...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign size={16} className="mr-2" />
                                            Release Payment
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorPaymentDetailsModal;