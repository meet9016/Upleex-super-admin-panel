'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { Search, X, Calendar } from 'lucide-react';
import { FiMoreVertical } from 'react-icons/fi';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { ColDef } from 'ag-grid-community';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { Card, CardContent } from '@/components/ui/Card';
import AgGridTable from '@/components/ui/AgGridTable';
import PageLoader from '@/components/common/PageLoader';
import StatusBadge from '@/components/common/StatusBadge';

interface VendorReportData {
  vendor_id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  vendor_type: 'vendor' | 'service' | 'both';
  registered_date: string;
  products: { total: number; rent: number; sell: number; active: number; approved: number };
  services: { total: number; active: number; approved: number };
  orders: { total: number; revenue: number };
  quotes: { total: number; revenue: number };
  revenue: { total: number; from_orders: number; from_quotes: number };
  wallet: { balance: number; total_credited: number; total_debited: number };
}

function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const VendorTypeRenderer = (params: any) => {
  const type = params.value || 'both';
  return (
    <div className="flex items-center h-full">
      <StatusBadge status={type} />
    </div>
  );
};

const AmountRenderer = (params: any) => (
  <div className="flex items-center h-full font-bold text-slate-800">
    ₹{((params.value as number) || 0).toLocaleString('en-IN')}
  </div>
);

const VendorRenderer = (params: any) => {
  const name = params.data?.full_name || '—';
  const email = params.data?.email || '';
  const business = params.data?.business_name || '';
  return (
    <div className="flex items-center gap-2 h-full">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
        <span className="text-blue-600 font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 leading-tight">{name}</p>
        {business && <p className="text-xs text-slate-500 leading-tight">{business}</p>}
        {email && <p className="text-xs text-slate-400 leading-tight">{email}</p>}
      </div>
    </div>
  );
};

const fmtDate = (val?: string | null) =>
  val ? new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function VendorReportsPage() {
  const gridRef = useRef<any>(null);
  const [vendors, setVendors] = useState<VendorReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showRevenueDropdown, setShowRevenueDropdown] = useState(false);
  const [showVendorTypeDropdown, setShowVendorTypeDropdown] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const revenueDropdownRef = useRef<HTMLDivElement>(null);
  const vendorTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [vendorTypeFilter, setVendorTypeFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [minRevenueFilter, setMinRevenueFilter] = useState('');
  const [maxRevenueFilter, setMaxRevenueFilter] = useState('');
  
  const [pendingDateRange, setPendingDateRange] = useState('');
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');
  const [pendingMinRevenue, setPendingMinRevenue] = useState('');
  const [pendingMaxRevenue, setPendingMaxRevenue] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (showActionsMenu && actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
      if (showDateDropdown && dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
      if (showRevenueDropdown && revenueDropdownRef.current && !revenueDropdownRef.current.contains(e.target as Node)) {
        setShowRevenueDropdown(false);
      }
      if (showVendorTypeDropdown && vendorTypeDropdownRef.current && !vendorTypeDropdownRef.current.contains(e.target as Node)) {
        setShowVendorTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showActionsMenu, showDateDropdown, showRevenueDropdown, showVendorTypeDropdown]);

  const fetchVendorReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (vendorTypeFilter) params.set('vendor_type', vendorTypeFilter);
      if (dateRangeFilter) params.set('date_range', dateRangeFilter);
      if (startDateFilter) params.set('start_date', startDateFilter);
      if (endDateFilter) params.set('end_date', endDateFilter);
      if (minRevenueFilter) params.set('min_revenue', minRevenueFilter);
      if (maxRevenueFilter) params.set('max_revenue', maxRevenueFilter);

      const res = await api.get(`${endPointApi.getVendorReport}?${params}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
      if (res.data?.success) {
        setVendors(res.data.data.vendors || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load vendor reports');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, vendorTypeFilter, dateRangeFilter, startDateFilter, endDateFilter, minRevenueFilter, maxRevenueFilter]);

  useEffect(() => { fetchVendorReports(); }, [fetchVendorReports]);

  const handleClearAll = () => {
    setSearch('');
    setVendorTypeFilter('');
    setDateRangeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setMinRevenueFilter('');
    setMaxRevenueFilter('');
    setPendingDateRange('');
    setPendingStartDate('');
    setPendingEndDate('');
    setPendingMinRevenue('');
    setPendingMaxRevenue('');
  };

  const removeFilter = (filterName: string) => {
    switch (filterName) {
      case 'vendor_type':
        setVendorTypeFilter('');
        break;
      case 'date_range':
        setDateRangeFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        break;
      case 'revenue':
        setMinRevenueFilter('');
        setMaxRevenueFilter('');
        break;
    }
  };

  const handleExportExcel = async () => {
    setExcelLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (vendorTypeFilter) params.set('vendor_type', vendorTypeFilter);
      if (dateRangeFilter) params.set('date_range', dateRangeFilter);
      if (startDateFilter) params.set('start_date', startDateFilter);
      if (endDateFilter) params.set('end_date', endDateFilter);
      if (minRevenueFilter) params.set('min_revenue', minRevenueFilter);
      if (maxRevenueFilter) params.set('max_revenue', maxRevenueFilter);

      const res = await api.get(`${endPointApi.exportVendorReportExcel}?${params}`, { responseType: 'blob' });
      
      if (res.data.size === 0) {
        toast.error('No data found to export with current filters');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendor-report-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported successfully');
      setShowActionsMenu(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to export Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (vendorTypeFilter) params.set('vendor_type', vendorTypeFilter);
      if (dateRangeFilter) params.set('date_range', dateRangeFilter);
      if (startDateFilter) params.set('start_date', startDateFilter);
      if (endDateFilter) params.set('end_date', endDateFilter);
      if (minRevenueFilter) params.set('min_revenue', minRevenueFilter);
      if (maxRevenueFilter) params.set('max_revenue', maxRevenueFilter);

      const res = await api.get(`${endPointApi.exportVendorReportPDF}?${params}`, { responseType: 'blob' });
      
      if (res.data.size === 0) {
        toast.error('No data found to export with current filters');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendor-report-${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
      setShowActionsMenu(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to export PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const colDefs: ColDef<any>[] = [
    { headerName: 'Vendor', field: 'full_name', cellRenderer: VendorRenderer, minWidth: 250, flex: 2 },
    { headerName: 'Type', field: 'vendor_type', cellRenderer: VendorTypeRenderer, minWidth: 100 },
    { headerName: 'Total Products', field: 'products.total', minWidth: 120, cellStyle: { textAlign: 'center', fontWeight: 'bold' } },
    { headerName: 'Rent Products', field: 'products.rent', minWidth: 120, cellStyle: { textAlign: 'center' } },
    { headerName: 'Sell Products', field: 'products.sell', minWidth: 120, cellStyle: { textAlign: 'center' } },
    { headerName: 'Services', field: 'services.total', minWidth: 100, cellStyle: { textAlign: 'center', fontWeight: 'bold' } },
    { headerName: 'Sell', field: 'orders.total', minWidth: 100, cellStyle: { textAlign: 'center', fontWeight: 'bold' } },
    { headerName: 'Sell Revenue', field: 'orders.revenue', cellRenderer: AmountRenderer, minWidth: 140 },
    { headerName: 'Rent', field: 'quotes.total', minWidth: 100, cellStyle: { textAlign: 'center', fontWeight: 'bold' } },
    { headerName: 'Rent Revenue', field: 'quotes.revenue', cellRenderer: AmountRenderer, minWidth: 140 },
    { headerName: 'Total Revenue', field: 'revenue.total', cellRenderer: AmountRenderer, minWidth: 150 },
    { headerName: 'Wallet Balance', field: 'wallet.balance', cellRenderer: AmountRenderer, minWidth: 150 },
    { headerName: 'Registered', field: 'registered_date', valueFormatter: (p: any) => fmtDate(p.value), minWidth: 130 },
  ];

  const dateOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom Range', value: 'custom' }
  ];

  const vendorTypeOptions = [
    { label: 'Vendor', value: 'vendor' },
    { label: 'Service', value: 'service' },
    { label: 'Both', value: 'both' }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Comprehensive analytics and insights for all vendors</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none rounded-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 pt-3 pb-2 px-4 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative w-56">
                  <input 
                    type="text" 
                    placeholder="Search vendors..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
                </div>

                {/* Vendor Type Filter */}
                <div className="relative" ref={vendorTypeDropdownRef}>
                  <button 
                    onClick={() => setShowVendorTypeDropdown(!showVendorTypeDropdown)} 
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${vendorTypeFilter ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>Vendor Type</span>
                    {vendorTypeFilter && <span className="px-2 py-0.5 bg-blue-200 rounded text-xs">{vendorTypeFilter}</span>}
                  </button>
                  {showVendorTypeDropdown && (
                    <div className="absolute top-full mt-2 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <button 
                          onClick={() => { setVendorTypeFilter(''); setShowVendorTypeDropdown(false); }} 
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded"
                        >
                          All Types
                        </button>
                        {vendorTypeOptions.map(option => (
                          <button 
                            key={option.value}
                            onClick={() => { setVendorTypeFilter(option.value); setShowVendorTypeDropdown(false); }} 
                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range Filter */}
                <div className="relative" ref={dateDropdownRef}>
                  <button 
                    onClick={() => { setPendingDateRange(dateRangeFilter); setPendingStartDate(startDateFilter); setPendingEndDate(endDateFilter); setShowDateDropdown(!showDateDropdown); }} 
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${dateRangeFilter || startDateFilter || endDateFilter ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>Date Range</span>
                    {dateRangeFilter && <span className="px-2 py-0.5 bg-blue-200 rounded text-xs">{dateRangeFilter}</span>}
                  </button>
                  {showDateDropdown && (
                    <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block font-semibold mb-2 text-sm text-gray-700">Quick Select</label>
                          <select 
                            value={pendingDateRange} 
                            onChange={e => setPendingDateRange(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          >
                            <option value="">Select Date Range</option>
                            {dateOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        {pendingDateRange === 'custom' && (
                          <>
                            <div>
                              <label className="block font-semibold mb-2 text-sm text-gray-700">Start Date</label>
                              <input type="date" value={pendingStartDate} onChange={e => setPendingStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                            </div>
                            <div>
                              <label className="block font-semibold mb-2 text-sm text-gray-700">End Date</label>
                              <input type="date" value={pendingEndDate} onChange={e => setPendingEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                            </div>
                          </>
                        )}
                        <div className="flex gap-2 pt-2 border-t">
                          <button onClick={() => { setPendingDateRange(''); setPendingStartDate(''); setPendingEndDate(''); setDateRangeFilter(''); setStartDateFilter(''); setEndDateFilter(''); setShowDateDropdown(false); }} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100">Clear</button>
                          <button onClick={() => { setDateRangeFilter(pendingDateRange); setStartDateFilter(pendingStartDate); setEndDateFilter(pendingEndDate); setShowDateDropdown(false); }} className="flex-1 px-3 py-2 btn-primary text-white rounded-lg text-sm">Apply</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Revenue Filter */}
                <div className="relative" ref={revenueDropdownRef}>
                  <button 
                    onClick={() => { setPendingMinRevenue(minRevenueFilter); setPendingMaxRevenue(maxRevenueFilter); setShowRevenueDropdown(!showRevenueDropdown); }} 
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${minRevenueFilter || maxRevenueFilter ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>Revenue Range</span>
                  </button>
                  {showRevenueDropdown && (
                    <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block font-semibold mb-2 text-sm text-gray-700">Total Revenue Range</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Min ₹" value={pendingMinRevenue} onChange={e => setPendingMinRevenue(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                            <input type="number" placeholder="Max ₹" value={pendingMaxRevenue} onChange={e => setPendingMaxRevenue(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <button onClick={() => { setPendingMinRevenue(''); setPendingMaxRevenue(''); setMinRevenueFilter(''); setMaxRevenueFilter(''); setShowRevenueDropdown(false); }} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100">Clear</button>
                          <button onClick={() => { setMinRevenueFilter(pendingMinRevenue); setMaxRevenueFilter(pendingMaxRevenue); setShowRevenueDropdown(false); }} className="flex-1 px-3 py-2 btn-primary text-white rounded-lg text-sm">Apply</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear All Button */}
                {(search || vendorTypeFilter || dateRangeFilter || minRevenueFilter || maxRevenueFilter) && (
                  <button onClick={handleClearAll} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors font-medium">Clear All</button>
                )}
              </div>

              {/* Export Button */}
              <div className="relative" ref={actionsMenuRef}>
                <button onClick={() => setShowActionsMenu(!showActionsMenu)} className="px-4 py-2 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300 font-medium shadow-sm" title="Export options">
                  <FiMoreVertical className="text-lg" />
                  <span className="text-sm">Export</span>
                </button>
                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                      <button onClick={handleExportExcel} disabled={excelLoading || pdfLoading} className="group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50">
                        <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to Excel</span>
                        {excelLoading && <span className="ml-auto text-emerald-600 text-xs">Loading...</span>}
                      </button>
                      <button onClick={handleExportPDF} disabled={excelLoading || pdfLoading} className="group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50">
                        <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to PDF</span>
                        {pdfLoading && <span className="ml-auto text-rose-600 text-xs">Loading...</span>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(vendorTypeFilter || dateRangeFilter || startDateFilter || endDateFilter || minRevenueFilter || maxRevenueFilter) && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
                <span className="text-xs font-semibold text-blue-700">Active Filters:</span>
                {vendorTypeFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Type: {vendorTypeFilter}
                    <button onClick={() => removeFilter('vendor_type')} className="hover:text-blue-900"><X size={12} /></button>
                  </span>
                )}
                {(dateRangeFilter || startDateFilter || endDateFilter) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Date: {dateRangeFilter || `${startDateFilter} to ${endDateFilter}`}
                    <button onClick={() => removeFilter('date_range')} className="hover:text-blue-900"><X size={12} /></button>
                  </span>
                )}
                {(minRevenueFilter || maxRevenueFilter) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Revenue: ₹{minRevenueFilter || '0'} - ₹{maxRevenueFilter || '∞'}
                    <button onClick={() => removeFilter('revenue')} className="hover:text-blue-900"><X size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="h-[600px] flex items-center justify-center">
                <PageLoader fullScreen={false} />
              </div>
            ) : (
              <AgGridTable
                ref={gridRef}
                rowData={vendors}
                columns={colDefs}
                loading={loading}
                height={700}
                rowHeight={60}
                showCheckboxes={false}
                noRowsMessage="No vendor reports found"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
