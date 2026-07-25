"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Loader2, Search } from "lucide-react";
import VendorServiceTreeTable from "@/components/ui/VendorServiceTreeTable";
import PageLoader from "@/components/common/PageLoader";

interface Service {
  _id: string;
  id?: string;
  service_name: string;
  category_name: string;
  price: string | number;
  approval_status: string;
  createdAt: string;
}

interface Vendor {
  _id: string;
  vendor_id: string;
  business_name: string;
  full_name: string;
  services?: Service[];
}

export default function VendorServiceApprovalPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [approvableCount, setApprovableCount] = useState(0);
  const [rejectableCount, setRejectableCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const gridRef = useRef(null);
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
    fetchVendorsWithServices(1, debouncedSearch);
  }, [debouncedSearch]);

  const fetchVendorsWithServices = async (pageNum: number, search: string = debouncedSearch) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Reusing products' vendors list or a new endpoint if available
      const res = await api.get(endPointApi.getAllServiceVendors, {
        params: { page: pageNum, limit: LIMIT, search }
      });

      const vendorList: Vendor[] = res?.data?.data || [];
      const totalPagesResp = res?.data?.totalPages;
      const pageResp = res?.data?.page || pageNum;

      // Services are now included in the vendor list from backend
      const vendorsWithServices = vendorList.map((vendor: any) => {
        return {
          ...vendor,
          services: vendor.services || [],
          pending_count: vendor.counts?.pending,
          approved_count: vendor.counts?.approved,
          rejected_count: vendor.counts?.rejected
        } as any;
      });

      setVendors(prev => {
        if (pageNum === 1) return vendorsWithServices;
        const seen = new Set(prev.map(v => v._id || v.vendor_id));
        const merged = [...prev];
        vendorsWithServices.forEach(v => {
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

  const handleStatusChange = async (serviceId: string, status: string) => {
    // Optimistic update
    const previousVendors = [...vendors];
    setVendors(prev => prev.map(v => {
      const updated = { ...v } as any;
      updated.services = (v.services || []).map(s => {
        const sid = String((s as any).id || (s as any)._id || '');
        return sid === String(serviceId) ? { ...s, approval_status: status } : s;
      });
      return updated;
    }));

    try {
      setApproving(true);
      const res = await api.put(`${endPointApi.approveService}/${serviceId}`, { approval_status: status });
      const vid = res?.data?.vendor_id;
      const counts = res?.data?.counts;
      
      // Update counts if they came back, status is already updated
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
      toast.success(`Service ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
      setVendors(previousVendors); // Revert on failure
    } finally {
      setApproving(false);
    }
  };

  const handleBulkApprove = async (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      toast.info("Select services to approve");
      return;
    }
    try {
      setApproving(true);
      const res = await api.post(endPointApi.bulkApproveServices, { service_ids: serviceIds });
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
        if ((v.services || []).length) {
          updated.services = (v.services || []).map(s => {
            const sid = String((s as any).id || (s as any)._id || '');
            return serviceIds.includes(sid) ? { ...s, approval_status: 'approved' } : s;
          });
        }
        return updated;
      }));
      toast.success(`${serviceIds.length} services approved`);
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  const handleBulkReject = async (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      toast.info("Select services to reject");
      return;
    }
    try {
      setRejecting(true);
      const res = await api.post(endPointApi.bulkRejectServices, { service_ids: serviceIds });
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
        if ((v.services || []).length) {
          updated.services = (v.services || []).map(s => {
            const sid = String((s as any).id || (s as any)._id || '');
            return serviceIds.includes(sid) ? { ...s, approval_status: 'rejected' } : s;
          });
        }
        return updated;
      }));
      toast.success(`${serviceIds.length} services rejected`);
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
        fetchVendorsWithServices(page + 1, debouncedSearch);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loadingMore, loading, debouncedSearch]);

  return (
    <div className="p-1">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Service Approval</h1>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search vendor or business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>
      <div className="bg-white rounded-lg min-h-[400px]">
        <VendorServiceTreeTable
          vendors={vendors}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          onStatusChange={handleStatusChange}
          approving={approving}
          rejecting={rejecting}
          loading={loading}
        />
            {loadingMore && (
              <div className="flex justify-center items-center py-8 border-t border-gray-100">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center justify-center w-5 h-5">
                    <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Loading more vendors...</span>
                </div>
              </div>
            )}

            {/* Load more button fallback */}
            {/* {hasMore && !loading && !loadingMore && vendors.length > 0 && (
              <div className="flex justify-center items-center py-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => fetchVendorsWithServices(page + 1)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Load More Vendors
                </button>
              </div>
            )} */}

            {/* {!hasMore && vendors.length > 0 && (
              <div className="flex justify-center py-8 border-t border-gray-100 bg-gray-50/30">
                <p className="text-sm text-gray-400 font-medium italic">All vendors loaded</p>
              </div>
            )} */}
      </div>
    </div>
  );
}
