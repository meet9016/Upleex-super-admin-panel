'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { Search, X, Filter } from 'lucide-react';
import { ColDef } from 'ag-grid-community';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { Card, CardContent } from '@/components/ui/Card';
import OrdersTreeTable from './ordersTreeTable';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import StatusBadge from '@/components/common/StatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SellOrder {
  _id: string;
  order_id: string;
  user_name: string;
  user_email: string;
  vendor_name: string;
  vendor_email: string;
  product_name: string;
  quantity: number;
  amount: number;
  payment_status: string;
  payment_type: string;
  order_status: string;
  createdAt: string;
}

// ─── Debounce Hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Cell Renderers ───────────────────────────────────────────────────────────
const StatusRenderer = (params: any) => (
  <div className="flex items-center h-full">
    <StatusBadge status={params.value || 'pending'} />
  </div>
);

const AmountRenderer = (params: any) => (
  <div className="flex items-center h-full font-bold text-slate-800">
    ₹{((params.value as number) || 0).toLocaleString('en-IN')}
  </div>
);

const fmtDate = (val?: string | null) =>
  val ? new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminOrdersPage() {
  const gridRef = useRef<any>(null);

  // ── Sell state ─────────────────────────────────────────────────────────────
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellTotal, setSellTotal] = useState(0);

  const [showSellFilter, setShowSellFilter] = useState(false);
  const sellFilterRef = useRef<HTMLDivElement>(null);
  const sellFilterBtnRef = useRef<HTMLButtonElement>(null);
  const [sellSearch, setSellSearch] = useState('');

  // applied
  const [sellPaymentFilter, setSellPaymentFilter] = useState('');
  const [sellOrderFilter, setSellOrderFilter] = useState('');
  const [sellVendorFilter, setSellVendorFilter] = useState('');
  const [sellProductFilter, setSellProductFilter] = useState('');
  // pending
  const [pendingSellPayment, setPendingSellPayment] = useState('');
  const [pendingSellOrder, setPendingSellOrder] = useState('');
  const [pendingSellVendor, setPendingSellVendor] = useState('');
  const [pendingSellProduct, setPendingSellProduct] = useState('');

  const debouncedSellSearch = useDebounce(sellSearch, 500);

  const sellActiveFilters = [sellPaymentFilter, sellOrderFilter, sellVendorFilter, sellProductFilter].filter(Boolean).length;

  // ── Click-outside for modals ───────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        sellFilterRef.current && !sellFilterRef.current.contains(e.target as Node) &&
        sellFilterBtnRef.current && !sellFilterBtnRef.current.contains(e.target as Node)
      ) setShowSellFilter(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Fetch Sell Orders ──────────────────────────────────────────────────────
  const fetchSellOrders = useCallback(async () => {
    setSellLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' });
      
      params.set('payment_status', sellPaymentFilter || 'paid');
      params.set('order_status', sellOrderFilter || 'confirmed');
      
      if (debouncedSellSearch) params.set('search', debouncedSellSearch);
      if (sellVendorFilter) params.set('vendor_name', sellVendorFilter);
      if (sellProductFilter) params.set('product_name', sellProductFilter);
      const res = await api.get(`${endPointApi.adminSellOrders}?${params}`);
      if (res.data?.success) {
        setSellOrders(res.data.data || []);
        setSellTotal(res.data.total || 0);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load sell orders');
    } finally {
      setSellLoading(false);
    }
  }, [debouncedSellSearch, sellPaymentFilter, sellOrderFilter, sellVendorFilter, sellProductFilter]);

  useEffect(() => {
    fetchSellOrders();
  }, [fetchSellOrders]);

  // ── Sell Column Defs ───────────────────────────────────────────────────────
  const sellColDefs: ColDef<any>[] = [
    { headerName: 'Vendor', field: 'vendor_name', rowGroup: true, hide: true, valueGetter: (p: any) => p.data?.vendor_name || '—' },
    { headerName: 'User', field: 'user_name', rowGroup: true, hide: true, valueGetter: (p: any) => p.data?.user_name || '—' },
    { headerName: 'Order ID', field: 'order_id', minWidth: 130, cellStyle: { fontFamily: 'monospace', fontSize: '12px' } },
    { headerName: 'Product Name', field: 'product_name', minWidth: 160, flex: 2, cellStyle: { fontWeight: '500' } },
    { headerName: 'Qty', field: 'quantity', minWidth: 80, maxWidth: 90, cellStyle: { textAlign: 'center' } },
    { headerName: 'Amount', field: 'amount', cellRenderer: AmountRenderer, minWidth: 130 },
    { headerName: 'Payment', field: 'payment_status', cellRenderer: StatusRenderer, minWidth: 140 },
    { headerName: 'Order Status', field: 'order_status', cellRenderer: StatusRenderer, minWidth: 150 },
    { headerName: 'Date', field: 'createdAt', minWidth: 120, valueFormatter: (p: any) => fmtDate(p.value), cellStyle: { color: "black", display: "flex", alignItems: "center" } },
  ];

  // ── Sell Filter Modal ──────────────────────────────────────────────────────
  const sellFilterContent = () => (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Filter Orders</h3>
        <button onClick={() => setShowSellFilter(false)} className="p-1 hover:bg-gray-100 rounded">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="space-y-4 pr-1">
        <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Vendor Name</label>
          <input
            type="text"
            value={pendingSellVendor}
            onChange={e => setPendingSellVendor(e.target.value)}
            placeholder="Enter vendor name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Product Name</label>
          <input
            type="text"
            value={pendingSellProduct}
            onChange={e => setPendingSellProduct(e.target.value)}
            placeholder="Enter product name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Payment Status</label>
          <SearchableDropdown
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Hold (30%)', value: 'hold' },
              { label: 'Failed', value: 'failed' },
              { label: 'Refunded', value: 'refunded' },
            ]}
            value={pendingSellPayment}
            onChange={v => setPendingSellPayment(Array.isArray(v) ? v[0] : v)}
            placeholder="Select Payment Status"
            maxHeight="max-h-60"
            showClear={false}
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Order Status</label>
          <SearchableDropdown
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Processing', value: 'processing' },
              { label: 'Shipped', value: 'shipped' },
              { label: 'Out for Delivery', value: 'out_for_delivery' },
              { label: 'Delivered', value: 'delivered' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'Returned', value: 'returned' },
            ]}
            value={pendingSellOrder}
            onChange={v => setPendingSellOrder(Array.isArray(v) ? v[0] : v)}
            placeholder="Select Order Status"
            maxHeight="max-h-60"
            showClear={false}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setPendingSellPayment(''); setPendingSellOrder('');
            setPendingSellVendor(''); setPendingSellProduct('');
            setSellPaymentFilter(''); setSellOrderFilter('');
            setSellVendorFilter(''); setSellProductFilter('');
            setShowSellFilter(false);
          }}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => {
            setSellPaymentFilter(pendingSellPayment);
            setSellOrderFilter(pendingSellOrder);
            setSellVendorFilter(pendingSellVendor);
            setSellProductFilter(pendingSellProduct);
            setShowSellFilter(false);
          }}
          className="flex-1 px-3 py-2 btn-primary text-white rounded-lg text-sm transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Orders Management</h2>
        </div>
        {/* <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-orange-50 text-orange-700 border-orange-200">
            Total Orders: {sellTotal}
          </span>
        </div> */}
      </div>

      <div className="grid gap-6">
        <Card className="border-none rounded-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-0">

            {/* ── Header Bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between  pt-3 pb-2 border-b border-gray-100">

              {/* Page Title Badge */}
              <div className="flex items-center gap-2">
                {/* <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="hidden sm:inline">Sell Orders</span>
                  <span className="sm:hidden">Sell</span>
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold bg-orange-200 text-orange-800">
                    {sellTotal}
                  </span>
                </div> */}
              </div>

              {/* ── Search + filter button ───────────────────────────── */}
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search orders, users, products..."
                    value={sellSearch}
                    onChange={e => setSellSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  {sellSearch && (
                    <button onClick={() => setSellSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <button
                    ref={sellFilterBtnRef}
                    onClick={() => {
                      setPendingSellPayment(sellPaymentFilter);
                      setPendingSellOrder(sellOrderFilter);
                      setPendingSellVendor(sellVendorFilter);
                      setPendingSellProduct(sellProductFilter);
                      setShowSellFilter(!showSellFilter);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white text-gray-500 border border-gray-300 rounded-xl hover:shadow-md transition-all duration-300"
                  >
                    <Filter size={18} />
                    {sellActiveFilters > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {sellActiveFilters}
                      </span>
                    )}
                  </button>
                  {showSellFilter && (
                    <div ref={sellFilterRef} className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-80 z-50 border border-gray-200">
                      {sellFilterContent()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Tree Table ─────────────────────────────────────────────────── */}
            <div className="h-[700px] w-full relative">
              <OrdersTreeTable
                ref={gridRef}
                data={sellOrders}
                type="sell"
                loading={sellLoading}
              />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
