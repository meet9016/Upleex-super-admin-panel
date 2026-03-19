"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import Loader from "@/components/common/Loader";
import VendorPaymentDetailsModal from "./VendorPaymentDetailsModal";
import VendorPaymentTreeTable from "./VendorPaymentTreeTable";

interface ProductPayment {
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    customerName: string;
    orderDate: string;
    deliveryStatus: string;
    paymentStatus: "pending" | "ready_for_release" | "released";
}

interface VendorPaymentData {
    _id: string;
    vendorId: string;
    vendorName: string;
    businessName: string;
    vendorEmail: string;
    vendorPhone: string;
    totalPaymentAmount: number;
    paymentDate: string;
    releaseDate: string;
    paymentMethod: string;
    transactionId: string;
    products: ProductPayment[];
}

// Mock data with multiple products per vendor
    const mockPaymentData: VendorPaymentData[] = [
        {
            _id: "1",
            vendorId: "V001",
            vendorName: "ABC Electronics",
            vendorEmail: "contact@abcelectronics.com",
            vendorPhone: "+91 98765 43210",
            businessName: "ABC Electronics Pvt Ltd",
            totalPaymentAmount: 275000,
            paymentDate: "2024-01-08T10:30:00Z", // 7+ days ago
            releaseDate: "2024-01-15T10:30:00Z",
            paymentMethod: "UPI",
            transactionId: "TXN001",
            products: [
                {
                    productId: "P001",
                    productName: "Samsung Galaxy S24",
                    quantity: 2,
                    unitPrice: 75000,
                    totalAmount: 150000,
                    category: "Smartphones",
                    customerName: "Rahul Sharma",
                    orderDate: "2024-01-08T10:30:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "ready_for_release"
                },
                {
                    productId: "P002",
                    productName: "iPhone 15 Pro",
                    quantity: 1,
                    unitPrice: 125000,
                    totalAmount: 125000,
                    category: "Smartphones",
                    customerName: "Priya Patel",
                    orderDate: "2024-01-08T11:00:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "ready_for_release"
                }
            ]
        },
        {
            _id: "2",
            vendorId: "V002",
            vendorName: "Tech Solutions",
            vendorEmail: "info@techsolutions.com",
            vendorPhone: "+91 99887 76655",
            businessName: "Tech Solutions India Ltd",
            totalPaymentAmount: 485000,
            paymentDate: "2024-01-03T14:20:00Z", // 7+ days ago
            releaseDate: "2024-01-10T14:20:00Z",
            paymentMethod: "Credit Card",
            transactionId: "TXN002",
            products: [
                {
                    productId: "P003",
                    productName: "MacBook Air M3",
                    quantity: 3,
                    unitPrice: 95000,
                    totalAmount: 285000,
                    category: "Laptops",
                    customerName: "Amit Kumar",
                    orderDate: "2024-01-03T14:20:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "released"
                },
                {
                    productId: "P004",
                    productName: "iPad Pro 12.9",
                    quantity: 2,
                    unitPrice: 85000,
                    totalAmount: 170000,
                    category: "Tablets",
                    customerName: "Sneha Gupta",
                    orderDate: "2024-01-03T15:00:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "released"
                },
                {
                    productId: "P005",
                    productName: "Apple Watch Series 9",
                    quantity: 1,
                    unitPrice: 30000,
                    totalAmount: 30000,
                    category: "Wearables",
                    customerName: "Vikash Singh",
                    orderDate: "2024-01-03T16:00:00Z",
                    deliveryStatus: "pending",
                    paymentStatus: "pending"
                }
            ]
        },
        {
            _id: "3",
            vendorId: "V003",
            vendorName: "Mobile World",
            vendorEmail: "sales@mobileworld.com",
            vendorPhone: "+91 88776 65544",
            businessName: "Mobile World Enterprises",
            totalPaymentAmount: 720000,
            paymentDate: "2024-01-05T16:45:00Z", // 7+ days ago
            releaseDate: "2024-01-12T16:45:00Z",
            paymentMethod: "Net Banking",
            transactionId: "TXN003",
            products: [
                {
                    productId: "P006",
                    productName: "OnePlus 12",
                    quantity: 4,
                    unitPrice: 55000,
                    totalAmount: 220000,
                    category: "Smartphones",
                    customerName: "Ravi Patel",
                    orderDate: "2024-01-05T16:45:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "pending"
                },
                {
                    productId: "P007",
                    productName: "Google Pixel 8 Pro",
                    quantity: 3,
                    unitPrice: 65000,
                    totalAmount: 195000,
                    category: "Smartphones",
                    customerName: "Anita Sharma",
                    orderDate: "2024-01-05T17:00:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "ready_for_release"
                },
                {
                    productId: "P008",
                    productName: "Nothing Phone 2",
                    quantity: 5,
                    unitPrice: 45000,
                    totalAmount: 225000,
                    category: "Smartphones",
                    customerName: "Suresh Kumar",
                    orderDate: "2024-01-12T17:30:00Z", // Recent order
                    deliveryStatus: "pending",
                    paymentStatus: "pending"
                },
                {
                    productId: "P009",
                    productName: "Realme GT 5 Pro",
                    quantity: 2,
                    unitPrice: 40000,
                    totalAmount: 80000,
                    category: "Smartphones",
                    customerName: "Deepak Singh",
                    orderDate: "2024-01-05T18:00:00Z",
                    deliveryStatus: "delivered",
                    paymentStatus: "ready_for_release"
                }
            ]
        }
    ];

export default function VendorPaymentsPage() {
    const [rowData, setRowData] = useState<VendorPaymentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<VendorPaymentData | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchVendorPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            // Simulate API call - replace with actual API endpoint
            setTimeout(() => {
                setRowData(mockPaymentData);
                setIsLoading(false);
            }, 1000);
        } catch (error: any) {
            console.error("Error fetching vendor payments:", error);
            toast.error("Failed to fetch vendor payments");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendorPayments();
    }, [fetchVendorPayments]);

    const handleReleasePayment = async (vendorId: string, productId?: string) => {
        const releaseId = productId || vendorId;
        setIsReleasing(releaseId);
        
        try {
            // Simulate API call for payment release
            setTimeout(() => {
                if (productId) {
                    // Release individual product payment
                    setRowData(prev => 
                        prev.map(vendor => ({
                            ...vendor,
                            products: vendor.products.map(product => 
                                productId.includes(product.productId)
                                    ? { ...product, paymentStatus: "released" as const }
                                    : product
                            )
                        }))
                    );
                    toast.success("Product payment released successfully");
                } else {
                    // Release all ready payments for vendor
                    setRowData(prev => 
                        prev.map(vendor => 
                            vendorId.includes(vendor.vendorId)
                                ? {
                                    ...vendor,
                                    products: vendor.products.map(product => 
                                        product.paymentStatus === 'ready_for_release'
                                            ? { ...product, paymentStatus: "released" as const }
                                            : product
                                    )
                                }
                                : vendor
                        )
                    );
                    toast.success("All ready payments released successfully");
                }
                setIsReleasing(null);
            }, 1500);
        } catch (error: any) {
            console.error("Error releasing payment:", error);
            toast.error("Failed to release payment");
            setIsReleasing(null);
        }
    };

    const handleViewDetails = (data: any) => {
        // If it's a product, find the vendor that contains this product
        if (data.type === 'product') {
            const vendor = rowData.find(v => 
                v.products.some(p => p.productId === data.productId)
            );
            if (vendor) {
                setSelectedPayment(vendor);
            } else {
                toast.error('Vendor data not found');
                return;
            }
        } else {
            // It's vendor data, use originalData or the data itself
            const vendorData = data.originalData || data;
            setSelectedPayment(vendorData as VendorPaymentData);
        }
        
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {isLoading ? (
                <Loader type="section" text="Loading vendor payment data..." />
            ) : rowData.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Search size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No payment records found</p>
                    </div>
                </div>
            ) : (
                <VendorPaymentTreeTable
                    data={rowData}
                    onViewDetails={handleViewDetails}
                    onReleasePayment={handleReleasePayment}
                    isReleasing={isReleasing}
                />
            )}

            {/* Vendor Payment Details Modal */}
            <VendorPaymentDetailsModal
                open={showDetailsModal}
                data={selectedPayment}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedPayment(null);
                }}
                onReleasePayment={(paymentId) => handleReleasePayment(paymentId)}
                isReleasing={isReleasing === selectedPayment?._id}
            />
        </div>
    );
}