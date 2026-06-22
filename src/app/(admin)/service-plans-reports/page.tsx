'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { exportServicePlansReportToExcel, exportServicePlansReportToPDF } from '@/utils/exportUtils';
import DatePicker from '@/components/ui/DatePicker';

interface ServicePlansReportData {
  invoice_no: string;
  date: string;
  transaction_type: string;
  description: string;
  deducted_from?: string;
  vendor_name: string;
  business_name: string;
  vendor_type: string;
  gst_number: string;
  rate: number;
  taxable_amount: number;
  gst_percent: string;
  total_amount: number;
}

function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const AmountRenderer = (params: any) => (
  <div className="flex items-center h-full font-bold text-slate-800">
    ₹{((params.value as number) || 0).toLocaleString('en-IN')}
  </div>
);

const VendorRenderer = (params: any) => {
  const name = params.data?.vendor_name || '—';
  const business = params.data?.business_name || '';
  return (
    <div className="flex items-center gap-2 h-full">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
        <span className="text-blue-600 font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 leading-tight">{name}</p>
        {business && <p className="text-xs text-slate-500 leading-tight">{business}</p>}
      </div>
    </div>
  );
};

const TransactionTypeRenderer = (params: any) => {
  const value = params.value;
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';
  let borderColor = 'border-gray-200';

  if (value === 'Service Listing Plan') {
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-700';
    borderColor = 'border-blue-200';
  } else if (value === 'Service Priority Plan') {
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-200';
  }

  return (
    <div className="flex items-center h-full">
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${bgColor} ${textColor} ${borderColor}`}>
        {value}
      </span>
    </div>
  );
};

export default function ServicePlansReportsPage() {
  const gridRef = useRef<any>(null);
  const [reports, setReports] = useState<ServicePlansReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (showActionsMenu && actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showActionsMenu]);

  const fetchServicePlansReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (startDateFilter) params.set('start_date', startDateFilter);
      if (endDateFilter) params.set('end_date', endDateFilter);
      if (startDateFilter || endDateFilter) params.set('date_range', 'custom');

      const res = await api.get(`${endPointApi.getServicePlansReport}?${params}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
      if (res.data?.success) {
        setReports(res.data.data.reports || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load service plans reports');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, startDateFilter, endDateFilter]);

  useEffect(() => { fetchServicePlansReports(); }, [fetchServicePlansReports]);

  const handleClearAll = () => {
    setSearch('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const removeFilter = (filterName: string) => {
    if (filterName === 'date_range') {
      setStartDateFilter('');
      setEndDateFilter('');
    }
  };

  const handleExportExcel = async () => {
    setExcelLoading(true);
    try {
      const filters = {
        search: search || undefined,
        date_range: (startDateFilter || endDateFilter) ? 'custom' : undefined,
        start_date: startDateFilter || undefined,
        end_date: endDateFilter || undefined,
      };

      const res = await exportServicePlansReportToExcel(filters);
      if (res.success) {
        toast.success(res.message);
        setShowActionsMenu(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to export Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const filters = {
        search: search || undefined,
        date_range: (startDateFilter || endDateFilter) ? 'custom' : undefined,
        start_date: startDateFilter || undefined,
        end_date: endDateFilter || undefined,
      };

      const res = await exportServicePlansReportToPDF(filters);
      if (res.success) {
        toast.success(res.message);
        setShowActionsMenu(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to export PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const colDefs: ColDef<any>[] = [
    { headerName: 'Invoice No', field: 'invoice_no', minWidth: 120 },
    { headerName: 'Date', field: 'date', minWidth: 120 },
    { headerName: 'Transaction Type', field: 'transaction_type', cellRenderer: TransactionTypeRenderer, minWidth: 200 },
    { headerName: 'Description', field: 'description', minWidth: 250 },
    { headerName: 'Vendor', field: 'vendor_name', cellRenderer: VendorRenderer, minWidth: 250, flex: 2 },
    { headerName: 'Vendor Type', field: 'vendor_type', minWidth: 120 },
    { headerName: 'GST Number', field: 'gst_number', minWidth: 140 },
    { headerName: 'Rate', field: 'rate', cellRenderer: AmountRenderer, minWidth: 120 },
    { headerName: 'Taxable Amount', field: 'taxable_amount', cellRenderer: AmountRenderer, minWidth: 140 },
    { headerName: 'GST %', field: 'gst_percent', minWidth: 100, cellStyle: { textAlign: 'center' } },
    { headerName: 'Total Amount', field: 'total_amount', cellRenderer: AmountRenderer, minWidth: 140 },
  ];

  const pinnedBottomRowData = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    
    let totalRate = 0;
    let totalTaxable = 0;
    let totalAmount = 0;
    
    reports.forEach(item => {
      totalRate += Number(item.rate || 0);
      totalTaxable += Number(item.taxable_amount || 0);
      totalAmount += Number(item.total_amount || 0);
    });

    return [{
      id: 'bottom-total',
      invoice_no: '',
      date: '',
      transaction_type: '',
      description: '',
      vendor_name: '',
      vendor_type: '',
      gst_number: 'TOTAL:',
      rate: totalRate,
      taxable_amount: totalTaxable,
      gst_percent: '',
      total_amount: totalAmount,
    }];
  }, [reports]);

  // Removed dateOptions since we're using direct DatePickers now

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Service Plans Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Analytics and insights for service plan purchases</p>
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
                    placeholder="Search reports..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
                </div>

                {/* Date Range Filter via DatePicker components */}
                <div className="flex items-center gap-2">
                  <div className="w-40 relative z-40">
                    <DatePicker 
                      value={startDateFilter} 
                      onChange={setStartDateFilter} 
                      className="w-full text-sm"
                    />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">to</span>
                  <div className="w-40 relative z-30">
                    <DatePicker 
                      value={endDateFilter} 
                      onChange={setEndDateFilter} 
                      min={startDateFilter}
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                {/* Clear All Button */}
                {(search || startDateFilter || endDateFilter) && (
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
            {(startDateFilter || endDateFilter) && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
                <span className="text-xs font-semibold text-blue-700">Active Filters:</span>
                {(startDateFilter || endDateFilter) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Date: {startDateFilter ? startDateFilter : 'Any'} to {endDateFilter ? endDateFilter : 'Any'}
                    <button onClick={() => removeFilter('date_range')} className="hover:text-blue-900"><X size={12} /></button>
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
                rowData={reports}
                columns={colDefs}
                loading={loading}
                height={700}
                rowHeight={60}
                showCheckboxes={false}
                noRowsMessage="No service plans reports found"
                pinnedBottomRowData={pinnedBottomRowData}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
