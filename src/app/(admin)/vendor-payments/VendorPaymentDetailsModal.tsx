"use client";

import React from "react";
import { X, Calendar, DollarSign, Package, User, CreditCard, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProductPayment {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    category: string;
    customerName: string;
    orderDate: string;
    deliveryStatus: string;
    paymentStatus: "pending" | "ready_for_release" | "released";
}

interface VendorPaymentDetails {
    _id: string;
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    vendorPhone: string;
    businessName: string;
    totalPaymentAmount: number;
    paymentDate: string;
    releaseDate: string;
    paymentMethod: string;
    transactionId: string;
    products: ProductPayment[];
}

interface VendorPaymentDetailsModalProps {
    open: boolean;
    data: VendorPaymentDetails | null;
    onClose: () => void;
    onReleasePayment?: (paymentId: string) => void;
    isReleasing?: boolean;
}

const VendorPaymentDetailsModal: React.FC<VendorPaymentDetailsModalProps> = ({
    open,
    data,
    onClose,
    onReleasePayment,
    isReleasing = false
}) => {
    if (!open || !data) return null;

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
            ready_for_release: { color: "bg-blue-100 text-blue-800 border-blue-200", text: "Ready for Release" },
            released: { color: "bg-green-100 text-green-800 border-green-200", text: "Released" }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getDeliveryStatusBadge = (status: string) => {
        const isDelivered = status === 'delivered';
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isDelivered 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
            }`}>
                {status}
            </span>
        );
    };

    // Calculate stats
    const readyProducts = data.products.filter(p => p.paymentStatus === 'ready_for_release');
    const releasedProducts = data.products.filter(p => p.paymentStatus === 'released');
    const pendingProducts = data.products.filter(p => p.paymentStatus === 'pending');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Vendor Payment Details</h2>
                            <p className="text-gray-600">Business: <span className="font-semibold">{data.businessName}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                            {data.products.length} Products
                        </span>
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Total Products</p>
                                            <p className="text-2xl font-bold text-gray-900">{data.products.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Total Amount</p>
                                            <p className="text-2xl font-bold text-green-600">{formatAmount(data.totalPaymentAmount)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-orange-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-8 w-8 text-orange-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Ready for Release</p>
                                            <p className="text-2xl font-bold text-orange-600">{readyProducts.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-8 w-8 text-purple-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Payment Method</p>
                                            <p className="text-sm font-semibold text-gray-900">{data.paymentMethod}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Vendor Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Vendor Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Vendor Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Business Name</label>
                                        <p className="text-gray-900 font-semibold">{data.businessName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                                        <p className="text-gray-900">{data.vendorName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                        <p className="text-gray-900">{data.vendorEmail}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                        <p className="text-gray-900">{data.vendorPhone}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Vendor ID</label>
                                        <p className="text-gray-900 font-mono text-sm">{data.vendorId}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Hash className="h-5 w-5 text-purple-600" />
                                        Payment Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                                        <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{data.transactionId}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Payment Date</label>
                                        <p className="text-gray-900">{formatDate(data.paymentDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Release Date</label>
                                        <p className="text-gray-900">{formatDate(data.releaseDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Payment Status Summary</label>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                {releasedProducts.length} Released
                                            </span>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {readyProducts.length} Ready
                                            </span>
                                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                {pendingProducts.length} Pending
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Products List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-indigo-600" />
                                    Products ({data.products.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.products.map((product, index) => (
                                        <div key={product.productId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="md:col-span-2">
                                                        <h4 className="font-semibold text-gray-900 mb-1">{product.productName}</h4>
                                                        <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                                                        <p className="text-sm text-gray-600">Product ID: <span className="font-mono">{product.productId}</span></p>
                                                        <p className="text-sm text-gray-600">Customer: {product.customerName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Quantity & Price</p>
                                                        <p className="font-semibold text-gray-900">{product.quantity} × {formatAmount(product.unitPrice)}</p>
                                                        <p className="text-sm text-gray-600 mt-1">Order Date: {new Date(product.orderDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Total Amount</p>
                                                        <p className="text-lg font-bold text-green-600">{formatAmount(product.totalAmount)}</p>
                                                        <div className="mt-2 space-y-1">
                                                            {getDeliveryStatusBadge(product.deliveryStatus)}
                                                            <br />
                                                            {getPaymentStatusBadge(product.paymentStatus)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Total Payment Amount: <span className="text-2xl font-bold text-green-600 ml-2">{formatAmount(data.totalPaymentAmount)}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorPaymentDetailsModal;