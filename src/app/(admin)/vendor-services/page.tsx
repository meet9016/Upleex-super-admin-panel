"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
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
  const LIMIT = 10;

  useEffect(() => {
    setVendors([]);
    setPage(1);
    setHasMore(true);
    fetchVendorsWithServices(1);
  }, []);

  const fetchVendorsWithServices = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Reusing products' vendors list or a new endpoint if available
      const res = await api.get(endPointApi.getAllServiceVendors, {
        params: { page: pageNum, limit: LIMIT }
      });

      const vendorList: Vendor[] = res?.data?.data || [];
      const totalPagesResp = res?.data?.totalPages;
      const pageResp = res?.data?.page || pageNum;

      // Fetch services for each vendor
      const vendorsWithServices = await Promise.all(
        vendorList.map(async (vendor: Vendor) => {
          if (!vendor.vendor_id) return { ...vendor, services: [] };
          try {
            const serviceRes = await api.get(`${endPointApi.getVendorServices}/${vendor.vendor_id}`);
            const payload = serviceRes.data?.data;
            const services = Array.isArray(payload) ? payload : payload?.services || [];
            const counts = Array.isArray(payload) ? null : payload?.counts || null;
            return {
              ...vendor,
              services,
              ...(counts ? { pending_count: counts.pending, approved_count: counts.approved, rejected_count: counts.rejected } : {})
            } as any;
          } catch (error) {
            console.error(`Failed to fetch services for vendor ${vendor.vendor_id}:`, error);
            return { ...vendor, services: [] };
          }
        })
      );

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

  const handleStatusChange = async (serviceId: string, status: string) => {
    try {
      setApproving(true);
      const res = await api.put(`${endPointApi.approveService}/${serviceId}`, { approval_status: status });
      const vid = res?.data?.vendor_id;
      const counts = res?.data?.counts;
      setVendors(prev => prev.map(v => {
        const updated = { ...v } as any;
        if (vid && (v as any).vendor_id === vid) {
          if (counts) {
            updated.pending_count = counts.pending;
            updated.approved_count = counts.approved;
            updated.rejected_count = counts.rejected;
          }
        }
        updated.services = (v.services || []).map(s => {
          const sid = String((s as any).id || (s as any)._id || '');
          return sid === String(serviceId) ? { ...s, approval_status: status } : s;
        });
        return updated;
      }));
      toast.success(`Service ${status}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error("Failed to update status");
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
      console.error('Failed to bulk approve:', error);
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
      console.error('Failed to bulk reject:', error);
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
        fetchVendorsWithServices(page + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loadingMore, loading]);

  return (
    <div className="p-1">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Service Approval</h1>
      </div>

      <div className="bg-white rounded-lg min-h-[400px]">
        {loading && vendors.length === 0 ? (
          <PageLoader />
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-gray-500">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium">No vendors with services found</p>
          </div>
        ) : (
          <>
            <VendorServiceTreeTable
              vendors={vendors}
              onBulkApprove={handleBulkApprove}
              onBulkReject={handleBulkReject}
              onStatusChange={handleStatusChange}
              approving={approving}
              rejecting={rejecting}
            />

            {loadingMore && (
              <div className="flex justify-center items-center py-8 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-500 font-medium">Loading more vendors...</span>
                </div>
              </div>
            )}

            {!hasMore && vendors.length > 0 && (
              <div className="flex justify-center py-8 border-t border-gray-100 bg-gray-50/30">
                <p className="text-sm text-gray-400 font-medium italic">All vendors loaded</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
