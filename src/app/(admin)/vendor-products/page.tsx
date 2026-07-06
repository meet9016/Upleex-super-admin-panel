"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Loader2, Search } from "lucide-react";
import VendorProductTreeTable from "@/components/ui/VendorProductTreeTable";
import PageLoader from "@/components/common/PageLoader";

interface Vendor {
  _id: string;
  vendor_id: string;
  business_name: string;
  full_name: string;
  products?: Product[];
}

interface Product {
  _id: string;
  id?: string;
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
  const [rejecting, setRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'rent' | 'sell'>('rent');
  const [overallCounts, setOverallCounts] = useState({ rent: 0, sell: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [generalPlanProductMap, setGeneralPlanProductMap] = useState<Record<string, string>>({});
  const LIMIT = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setVendors([]);
    setPage(1);
    setHasMore(true);
    fetchVendorsWithProducts(1, activeTab, debouncedSearch);
    fetchGeneralPlanMap();
  }, [activeTab, debouncedSearch]);

  const fetchGeneralPlanMap = async () => {
    try {
      const res = await api.get(endPointApi.getAllGeneralPlanPurchases);
      const purchases: any[] = res?.data?.data || [];
      const map: Record<string, string> = {};
      const now = new Date();
      
      purchases.forEach((purchase: any) => {
        if (purchase.expire_at && new Date(purchase.expire_at) < now) return;
        const planType: string = purchase.plan_type || '';
        const productIds: any[] = purchase.product_ids || [];
        
        productIds.forEach((prod: any) => {
          const id = typeof prod === 'string' ? prod : String(prod._id || prod.id || prod.product_id || '');
          if (id) map[id] = planType;
        });
      });
      
      setGeneralPlanProductMap(map);
    } catch (error) {
      console.error('Failed to fetch general plan map', error);
    }
  };

  const fetchVendorsWithProducts = async (pageNum: number, tab: 'rent' | 'sell' = activeTab, search: string = debouncedSearch) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filter_rent_sell = tab === 'rent' ? 1 : 2;

      const res = await api.get(endPointApi.getAllVendors, {
        params: { page: pageNum, limit: LIMIT, filter_rent_sell, search }
      });

      const vendorList: Vendor[] = res?.data?.data || [];
      const totalPagesResp = res?.data?.totalPages;
      const pageResp = res?.data?.page || pageNum;
      
      // Set overall counts from API
      if (res?.data?.overallCounts) {
        setOverallCounts(res.data.overallCounts);
      }

      // Map vendors from API response to our Vendor interface
      const vendorsWithProducts = vendorList.map((vendor: any) => {
        return {
          ...vendor,
          products: vendor.products || [],
          pending_count: vendor.counts?.pending,
          approved_count: vendor.counts?.approved,
          rejected_count: vendor.counts?.rejected
        } as any;
      });

      vendorsWithProducts.forEach((v, i) => {
        console.log(`  Vendor ${i + 1} (${v.vendor_id}):`, (v.products || []).length, 'products');
      });

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
    // Optimistic update
    const previousVendors = [...vendors];
    setVendors(prev => prev.map(v => {
      const updated = { ...v } as any;
      updated.products = (v.products || []).map(p => {
        const pid = String((p as any).id || (p as any)._id || '');
        return pid === String(productId) ? { ...p, approval_status: status } : p;
      });
      return updated;
    }));

    try {
      const res = await api.put(`${endPointApi.approveProduct}/${productId}`, { 
        approval_status: status 
      });
      
      const vid = res?.data?.vendor_id;
      const counts = res?.data?.counts;
      
      // Update counts if they came back from API, but status is already updated
      if (vid || counts) {
        setVendors(prev => prev.map(v => {
          const updated = { ...v } as any;
          if (vid && (v as any).vendor_id === vid) {
            if (counts) {
              updated.pending_count = counts.pending;
              updated.approved_count = counts.approved;
              updated.rejected_count = counts.rejected;
            }
          }
          return updated;
        }));
      }
      
      const message = res?.data?.message || `Product ${status} successfully`;
      toast.success(message);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update status';
      toast.error(errorMessage);
      setVendors(previousVendors); // Revert on failure
    }
  };

  const handleBulkApprove = async (productIds: string[]) => {
    if (productIds.length === 0) {
      toast.info("Select products to approve");
      return;
    }
    try {
      setApproving(true);
      const res = await api.post(endPointApi.bulkApproveProducts, { product_ids: productIds });
      const map = res?.data?.countsByVendor || {};
      setVendors(prev => prev.map(v => {
        const vid = (v as any).vendor_id;
        const counts = map[vid];
        const updated = { ...v } as any;
        if (counts) {
          updated.pending_count = counts.pending;
          updated.approved_count = counts.approved;
          updated.rejected_count = counts.rejected;
        }
        if ((v.products || []).length) {
          updated.products = (v.products || []).map(p => {
            const pid = String((p as any).id || (p as any)._id || '');
            return productIds.includes(pid) ? { ...p, approval_status: 'approved' } : p;
          });
        }
        return updated;
      }));
      toast.success(`${productIds.length} products approved`);
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  const handleBulkReject = async (productIds: string[]) => {
    if (productIds.length === 0) {
      toast.info("Select products to reject");
      return;
    }
    try {
      setRejecting(true);
      const res = await api.post(endPointApi.bulkRejectProducts, { product_ids: productIds });
      const map = res?.data?.countsByVendor || {};
      setVendors(prev => prev.map(v => {
        const vid = (v as any).vendor_id;
        const counts = map[vid];
        const updated = { ...v } as any;
        if (counts) {
          updated.pending_count = counts.pending;
          updated.approved_count = counts.approved;
          updated.rejected_count = counts.rejected;
        }
        if ((v.products || []).length) {
          updated.products = (v.products || []).map(p => {
            const pid = String((p as any).id || (p as any)._id || '');
            return productIds.includes(pid) ? { ...p, approval_status: 'rejected' } : p;
          });
        }
        return updated;
      }));
      toast.success(`${productIds.length} products rejected`);
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  // Scroll handler for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loadingMore || loading) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;

      if (scrollPosition >= threshold) {
        fetchVendorsWithProducts(page + 1, activeTab);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loadingMore, loading]);

  return (
    <div className="p-1">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Product Approval</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
            placeholder="Search vendor or business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg">
            <VendorProductTreeTable
              loading={loading}
              vendors={vendors}
              onBulkApprove={handleBulkApprove}
              onBulkReject={handleBulkReject}
              onStatusChange={handleStatusChange}
              approving={approving}
              rejecting={rejecting}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              overallCounts={overallCounts}
              generalPlanProductMap={generalPlanProductMap}
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

            {/* Load more button fallback */}
            {/* {hasMore && !loading && !loadingMore && vendors.length > 0 && (
              <div className="flex justify-center items-center py-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => fetchVendorsWithProducts(page + 1, activeTab)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Load More Vendors
                </button>
              </div>
            )} */}

      </div>
    </div>
  );
}