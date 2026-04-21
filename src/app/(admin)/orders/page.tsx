'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
interface RentOrder {
  _id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string;
  product_name: string;
  product_type: string;
  qty: number;
  number_of_days: number;
  product_listing_type_name: string;
  amount: number;
  quote_status: string;
  payment_status: string;
  start_date: string;
  end_date: string;
  createdAt: string;
}

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

const VendorRenderer = (params: any) => {
  const name = params.data?.vendor_name || '—';
  const email = params.data?.vendor_email || '';
  return (
    <div className="flex items-center gap-2 h-full">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
        <span className="text-blue-600 font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800 leading-tight">{name}</p>
        {email && <p className="text-xs text-slate-400 leading-tight">{email}</p>}
      </div>
    </div>
  );
};

const UserRenderer = (params: any) => {
  const name = params.data?.user_name || '—';
  const email = params.data?.user_email || '';
  return (
    <div className="flex items-center gap-2 h-full">
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
        <span className="text-emerald-600 font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800 leading-tight">{name}</p>
        {email && <p className="text-xs text-slate-400 leading-tight">{email}</p>}
      </div>
    </div>
  );
};

const fmtDate = (val?: string | null) =>
  val ? new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'rent' | 'sell'>('rent');
  const gridRef = useRef<any>(null);

  // ── Rent state ─────────────────────────────────────────────────────────────
  const [rentOrders, setRentOrders] = useState<RentOrder[]>([]);
  const [rentLoading, setRentLoading] = useState(false);
  const [rentTotal, setRentTotal] = useState(0);

  const [showRentFilter, setShowRentFilter] = useState(false);
  const rentFilterRef = useRef<HTMLDivElement>(null);
  const rentFilterBtnRef = useRef<HTMLButtonElement>(null);
  const [rentSearch, setRentSearch] = useState('');

  // applied
  const [rentStatusFilter, setRentStatusFilter] = useState('');
  const [rentPaymentFilter, setRentPaymentFilter] = useState('');
  const [rentVendorFilter, setRentVendorFilter] = useState('');
  const [rentProductFilter, setRentProductFilter] = useState('');
  const [pendingRentStatus, setPendingRentStatus] = useState('');
  const [pendingRentPayment, setPendingRentPayment] = useState('');
  const [pendingRentVendor, setPendingRentVendor] = useState('');
  const [pendingRentProduct, setPendingRentProduct] = useState('');

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

  const debouncedRentSearch = useDebounce(rentSearch, 500);
  const debouncedSellSearch = useDebounce(sellSearch, 500);

  const rentActiveFilters = [rentStatusFilter, rentPaymentFilter, rentVendorFilter, rentProductFilter].filter(Boolean).length;
  const sellActiveFilters = [sellPaymentFilter, sellOrderFilter, sellVendorFilter, sellProductFilter].filter(Boolean).length;

  // ── Click-outside for modals ───────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        rentFilterRef.current && !rentFilterRef.current.contains(e.target as Node) &&
        rentFilterBtnRef.current && !rentFilterBtnRef.current.contains(e.target as Node)
      ) setShowRentFilter(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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

  // ── Fetch Rent Orders ──────────────────────────────────────────────────────
  const fetchRentOrders = useCallback(async () => {
    setRentLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' });
      if (debouncedRentSearch) params.set('search', debouncedRentSearch);
      if (rentStatusFilter) params.set('status', rentStatusFilter);
      if (rentPaymentFilter) params.set('payment_status', rentPaymentFilter);
      if (rentVendorFilter) params.set('vendor_name', rentVendorFilter);
      if (rentProductFilter) params.set('product_name', rentProductFilter);
      const res = await api.get(`${endPointApi.adminRentOrders}?${params}`);
      if (res.data?.success) {
        setRentOrders(res.data.data || []);
        setRentTotal(res.data.total || 0);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load rent orders');
    } finally {
      setRentLoading(false);
    }
  }, [debouncedRentSearch, rentStatusFilter, rentPaymentFilter, rentVendorFilter, rentProductFilter]);

  // ── Fetch Sell Orders ──────────────────────────────────────────────────────
  const fetchSellOrders = useCallback(async () => {
    setSellLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' });
      if (debouncedSellSearch) params.set('search', debouncedSellSearch);
      if (sellPaymentFilter) params.set('payment_status', sellPaymentFilter);
      if (sellOrderFilter) params.set('order_status', sellOrderFilter);
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
    if (activeTab === 'rent') {
      fetchRentOrders();
    }
  }, [fetchRentOrders, activeTab]);

  useEffect(() => {
    if (activeTab === 'sell') {
      fetchSellOrders();
    }
  }, [fetchSellOrders, activeTab]);

  // ── Rent Column Defs ───────────────────────────────────────────────────────
  const rentColDefs: ColDef<any>[] = [
    { headerName: 'Vendor', field: 'vendor_name', rowGroup: true, hide: true, valueGetter: (p: any) => p.data?.vendor_name || '—' },
    { headerName: 'User', field: 'user_name', rowGroup: true, hide: true, valueGetter: (p: any) => p.data?.user_name || '—' },
    { headerName: 'Product Name', field: 'product_name', minWidth: 160, flex: 2, cellStyle: { fontWeight: '500', color: '#334155' } },
    { headerName: 'Type', field: 'product_listing_type_name', minWidth: 100, cellStyle: { textTransform: 'capitalize', fontWeight: 'bold' } },
    { headerName: 'Qty', field: 'qty', minWidth: 70, maxWidth: 80, cellStyle: { textAlign: 'center' } },
    {
      headerName: 'Duration',
      minWidth: 120,
      cellStyle: { textAlign: 'center' },
      valueGetter: (p: any) => {
        const val = p.data?.number_of_days;
        const type = p.data?.product_listing_type_name?.toLowerCase();
        if (!val || val <= 0) return '—';
        if (type === 'hourly') return `${val} Hours`;
        if (type === 'monthly') return `${val} Months`;
        return `${val} Days`;
      }
    },
    { headerName: 'Start Date', field: 'start_date', minWidth: 120, valueFormatter: (p: any) => fmtDate(p.value) },
    { headerName: 'End Date', field: 'end_date', minWidth: 120, valueFormatter: (p: any) => fmtDate(p.value) },
    { headerName: 'Amount', field: 'amount', cellRenderer: AmountRenderer, minWidth: 130 },
    { headerName: 'Quote Status', field: 'quote_status', cellRenderer: StatusRenderer, minWidth: 145 },
    { headerName: 'Payment Status', field: 'payment_status', cellRenderer: StatusRenderer, minWidth: 150 },
    { headerName: 'Date', field: 'createdAt', minWidth: 120, valueFormatter: (p: any) => fmtDate(p.value), cellStyle: { color: "black", display: "flex", alignItems: "center" } },
  ];

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

  // ── Rent Filter Modal ──────────────────────────────────────────────────────
  const rentFilterContent = () => (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Filter Rent Orders</h3>
        <button onClick={() => setShowRentFilter(false)} className="p-1 hover:bg-gray-100 rounded">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="space-y-4 pr-1">
        {/* <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Vendor Name</label>
          <input
            type="text"
            value={pendingRentVendor}
            onChange={e => setPendingRentVendor(e.target.value)}
            placeholder="Enter vendor name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          />
        </div> */}
        {/* <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Product Name</label>
          <input
            type="text"
            value={pendingRentProduct}
            onChange={e => setPendingRentProduct(e.target.value)}
            placeholder="Enter product name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          />
        </div> */}
        <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Quote Status</label>
          <SearchableDropdown
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approval' },
              { label: 'Active', value: 'active' },
              { label: 'Delivery', value: 'delivery' },
              { label: 'Complete', value: 'complete' },
              { label: 'Successful', value: 'successful' },
              { label: 'Rejected', value: 'reject' },
            ]}
            value={pendingRentStatus}
            onChange={v => setPendingRentStatus(Array.isArray(v) ? v[0] : v)}
            placeholder="Select Quote Status"
            maxHeight="max-h-60"
            showClear={false}
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-sm text-gray-700">Payment Status</label>
          <SearchableDropdown
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Failed', value: 'failed' },
            ]}
            value={pendingRentPayment}
            onChange={v => setPendingRentPayment(Array.isArray(v) ? v[0] : v)}
            placeholder="Select Payment Status"
            maxHeight="max-h-60"
            showClear={false}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setPendingRentStatus(''); setPendingRentPayment('');
            setPendingRentVendor(''); setPendingRentProduct('');
            setRentStatusFilter(''); setRentPaymentFilter('');
            setRentVendorFilter(''); setRentProductFilter('');
            setShowRentFilter(false);
          }}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => {
            setRentStatusFilter(pendingRentStatus);
            setRentPaymentFilter(pendingRentPayment);
            setRentVendorFilter(pendingRentVendor);
            setRentProductFilter(pendingRentProduct);
            setShowRentFilter(false);
          }}
          className="flex-1 px-3 py-2 btn-primary text-white rounded-lg text-sm transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );

  // ── Sell Filter Modal ──────────────────────────────────────────────────────
  const sellFilterContent = () => (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Filter Sell Orders</h3>
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
          <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
            Total Rent: {rentTotal}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-orange-50 text-orange-700 border-orange-200">
            Total Sell: {sellTotal}
          </span>
        </div> */}
      </div>

      <div className="grid gap-6">
        <Card className="border-none rounded-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-0">

            {/* ── Tab Bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between  pt-3 pb-2 border-b border-gray-100">

              {/* Pill Tabs */}
              <div className="flex items-center bg-gray-100/80 rounded-xl p-1 gap-1">
                <button
                  onClick={() => { setActiveTab('rent'); gridRef.current?.api?.deselectAll?.(); }}
                  className={`group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'rent'
                      ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/[0.04]'
                      : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <svg className={`w-3.5 h-3.5 ${activeTab === 'rent' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Rent</span>
                  <span className="sm:hidden">R</span>
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'rent' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                    {rentTotal}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('sell'); gridRef.current?.api?.deselectAll?.(); }}
                  className={`group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'sell'
                      ? 'bg-white text-orange-600 shadow-md ring-1 ring-black/[0.04]'
                      : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <svg className={`w-3.5 h-3.5 ${activeTab === 'sell' ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="hidden sm:inline">Sell</span>
                  <span className="sm:hidden">S</span>
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'sell' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'}`}>
                    {sellTotal}
                  </span>
                </button>
              </div>

              {/* ── RENT search + filter button ───────────────────────────── */}
              {activeTab === 'rent' && (
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Search vendors, users, products..."
                      value={rentSearch}
                      onChange={e => setRentSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    {rentSearch && (
                      <button onClick={() => setRentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      ref={rentFilterBtnRef}
                      onClick={() => {
                        setPendingRentStatus(rentStatusFilter);
                        setPendingRentPayment(rentPaymentFilter);
                        setPendingRentVendor(rentVendorFilter);
                        setPendingRentProduct(rentProductFilter);
                        setShowRentFilter(!showRentFilter);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-white text-gray-500 border border-gray-300 rounded-xl hover:shadow-md transition-all duration-300"
                    >
                      <Filter size={18} />
                      {rentActiveFilters > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {rentActiveFilters}
                        </span>
                      )}
                    </button>
                    {showRentFilter && (
                      <div ref={rentFilterRef} className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-80 z-50 border border-gray-200">
                        {rentFilterContent()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SELL search + filter button ───────────────────────────── */}
              {activeTab === 'sell' && (
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
              )}
            </div>

            {/* ── Tree Table ─────────────────────────────────────────────────── */}
            <div className="h-[700px] w-full relative">
              {activeTab === 'rent' ? (
                <OrdersTreeTable
                  ref={gridRef}
                  data={rentOrders}
                  type="rent"
                  loading={rentLoading}
                />
              ) : (
                <OrdersTreeTable
                  ref={gridRef}
                  data={sellOrders}
                  type="sell"
                  loading={sellLoading}
                />
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
