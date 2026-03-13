"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  useEffect(() => {
    setVendors([]);
    setPage(1);
    setHasMore(true);
    fetchVendorsWithProducts(1);
  }, []);

  const fetchVendorsWithProducts = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const res = await api.get(endPointApi.getAllVendors, { 
        params: { page: pageNum, limit: LIMIT } 
      });
      
      const vendorList: Vendor[] = res?.data?.data || [];
      const totalPagesResp = res?.data?.totalPages;
      const pageResp = res?.data?.page || pageNum;

      // Fetch products for each vendor of this page
      const vendorsWithProducts = await Promise.all(
        vendorList.map(async (vendor: Vendor) => {
          if (!vendor.vendor_id) return { ...vendor, products: [] };
          try {
            const productRes = await api.get(`${endPointApi.getVendorProducts}/${vendor.vendor_id}`);
            return { ...vendor, products: productRes.data?.data || [] };
          } catch (error) {
            console.error(`Failed to fetch products for vendor ${vendor.vendor_id}:`, error);
            return { ...vendor, products: [] };
          }
        })
      );

      setVendors(prev => {
        if (pageNum === 1) return vendorsWithProducts;
        
        const seen = new Set(prev.map(v => v._id || v.vendor_id));
        const merged = [...prev];
        vendorsWithProducts.forEach(v => {
          const key = v._id || v.vendor_id;
          if (!seen.has(key)) merged.push(v);
        });
        return merged;
      });

      if (typeof totalPagesResp === 'number') {
        setTotalPages(totalPagesResp);
        setHasMore(pageResp < totalPagesResp);
      } else {
        setHasMore(vendorList.length >= LIMIT);
      }
      setPage(pageResp);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error("Failed to fetch vendors");
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      setApproving(true);
      await api.put(`${endPointApi.approveProduct}/${productId}`, { approval_status: status });
      toast.success(`Product ${status}`);
      // Refresh the current page after status change
      await fetchVendorsWithProducts(page);
    } catch (error) {
      console.error('Failed to update status:', error);
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
      // Refresh the current page after bulk approve
      await fetchVendorsWithProducts(page);
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      toast.error("Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  // Scroll handler for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loadingMore || loading) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      
      if (scrollPosition >= threshold) {
        fetchVendorsWithProducts(page + 1);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loadingMore, loading]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Product Approval</h1>
        <p className="text-sm text-gray-500 mt-1">
         Manage vendor product approvals
        </p>
      </div>

      <div className="bg-white rounded-lg">
        {loading && vendors.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-4" />
            <p className="text-lg">No vendors found</p>
          </div>
        ) : (
          <>
            <VendorProductTreeTable
              vendors={vendors}
              onBulkApprove={handleBulkApprove}
              onStatusChange={handleStatusChange}
              approving={approving}
            />
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-500">Loading more vendors...</span>
                </div>
              </div>
            )}
            
            {/* End of list message */}
            {!hasMore && vendors.length > 0 && (
              <div className="flex justify-center py-6 border-t border-gray-200">
                <p className="text-sm text-gray-400">No more vendors to load</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}