"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import VendorProductTreeTable from "@/components/ui/VendorProductTreeTable";

interface Vendor {
  _id: string;
  vendor_id: string;
  business_name: string;
  full_name: string;
  pendingCount: number;
  products?: Product[];
}

interface Product {
  _id: string;
  product_name: string;
  category_name: string;
  price: number;
  approval_status: string;
  createdAt: string;
}

export default function VendorProductApprovalPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchVendorsWithProducts();
  }, []);

  const fetchVendorsWithProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(endPointApi.getAllVendors);
      const vendorList = res.data?.data || [];

      console.log('Vendors fetched:', vendorList);

      // Fetch products for each vendor
      const vendorsWithProducts = await Promise.all(
        vendorList.map(async (vendor: Vendor) => {
          // Skip if vendor_id is missing
          if (!vendor.vendor_id) {
            console.warn('Vendor missing vendor_id:', vendor);
            return { ...vendor, products: [] };
          }

          try {
            const productRes = await api.get(`${endPointApi.getVendorProducts}/${vendor.vendor_id}`);
            return {
              ...vendor,
              products: productRes.data?.data || [],
            };
          } catch (error) {
            console.error(`Failed to fetch products for vendor ${vendor.vendor_id}:`, error);
            return { ...vendor, products: [] };
          }
        })
      );

      console.log('Vendors with products:', vendorsWithProducts);
      setVendors(vendorsWithProducts);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      setApproving(true);
      await api.put(`${endPointApi.approveProduct}/${productId}`, { approval_status: status });
      toast.success(`Product ${status}`);
      fetchVendorsWithProducts();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setApproving(false);
    }
  };

  const handleBulkApprove = async (productIds: string[]) => {
    if (productIds.length === 0) {
      toast.info("Select products to approve");
      return;
    }
    try {
      setApproving(true);
      await api.post(endPointApi.bulkApproveProducts, { product_ids: productIds });
      toast.success(`${productIds.length} products approved`);
      fetchVendorsWithProducts();
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Approval</h1>
        <p className="text-gray-600 mt-1">Manage vendor product approvals</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg">No vendors found</p>
          </div>
        ) : (
          <VendorProductTreeTable
            vendors={vendors}
            onBulkApprove={handleBulkApprove}
            onStatusChange={handleStatusChange}
            approving={approving}
          />
        )}
      </div>
    </div>
  );
}
