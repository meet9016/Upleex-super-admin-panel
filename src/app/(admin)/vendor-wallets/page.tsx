'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/utils/axiosInstance';   // ← Your axios instance
import endPointApi from '@/utils/endPointApi';
import { toast } from 'react-toastify';
import { MdWallet, MdHistory, MdArrowUpward, MdArrowDownward, MdSearch, MdDownload, MdMoreVert } from 'react-icons/md';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import AgGridTable from '@/components/ui/AgGridTable';
import ActionButtons from '@/components/common/ActionButtons';
import { ColDef } from 'ag-grid-community';
import PageLoader from '@/components/common/PageLoader';
import { X, Loader2 } from 'lucide-react';
import { exportVendorWalletsToExcel, exportVendorWalletsToPDF } from '@/utils/exportUtils';
import Loader from '@/components/common/Loader';
import { BsThreeDotsVertical } from 'react-icons/bs';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface VendorWallet {
  _id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  balance: number;
  total_credited: number;
  total_debited: number;
  currency: string;
  is_active: boolean;
  transaction_count: number;
  id?: string;
}

interface WalletTransaction {
  _id: string;
  transaction_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  date: string;
}

const VendorWalletsPage = () => {
  const [vendors, setVendors] = useState<VendorWallet[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 600);

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Fetch all vendor wallets with optional search param
  const fetchVendorWallets = async (search?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;

      const res = await api.get(endPointApi.getAllVendorWallets, { params });
      // Handle different response structures
      const payload = res?.data?.data;
      const wallets = Array.isArray(payload) ? payload : payload?.wallets || [];

      const walletsWithId = wallets.map((wallet: VendorWallet) => ({
        ...wallet,
        id: wallet._id || (wallet as any).id,
      }));

      setVendors(walletsWithId);
    } catch (error: any) {
      console.error('Error fetching vendor wallets:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch vendor wallets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions for a specific vendor
  const fetchVendorTransactions = async (vendorId: string) => {
    try {
      setLoading(true);
      const endpoint = endPointApi.getVendorWalletTransactions.replace(':vendorId', vendorId);

      const res = await api.get(endpoint);

      const payload = res?.data?.data;
      const transactionsList = Array.isArray(payload) ? payload : payload?.transactions || [];

      setTransactions(transactionsList);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (vendor: VendorWallet) => {
    setSelectedVendor(vendor);
    setShowTransactions(true);
    fetchVendorTransactions(vendor.vendor_id || vendor._id);
  };

  const handleDownloadPDF = async () => {
    if (!selectedVendor) return;
    try {
      setDownloading(true);
      const vendor_id = selectedVendor.vendor_id || selectedVendor.id || selectedVendor._id;
      
      const response = await api.get(endPointApi.exportWalletTransactionsPDF, {
        params: { vendor_id },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${selectedVendor.vendor_name || 'vendor'}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF Downloaded successfully");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch.length >= 3 || debouncedSearch.length === 0) {
      fetchVendorWallets(debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = searchTerm ? { search: searchTerm } : {};
      await exportVendorWalletsToExcel(params);
      toast.success('Vendor Wallets exported to Excel successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const params = searchTerm ? { search: searchTerm } : {};
      await exportVendorWalletsToPDF(params);
      toast.success('Vendor Wallets exported to PDF successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns: ColDef[] = useMemo(() => [
    { field: 'vendor_name', headerName: 'Vendor Name', flex: 1, minWidth: 150 },
    { field: 'vendor_email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'balance',
      headerName: 'Balance',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: any) => (
        <span className="text-blue-600 dark:text-blue-400 font-semibold">
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      field: 'total_credited',
      headerName: 'Credited',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: any) => (
        <span className="text-green-600 dark:text-green-400 font-semibold">
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      field: 'total_debited',
      headerName: 'Debited',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: any) => (
        <span className="text-red-600 dark:text-red-400 font-semibold">
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      headerName: 'Action',
      width: 100,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      cellRenderer: (params: any) => {
        const vendor = params.data as VendorWallet;
        return (
          <ActionButtons
            onHistory={() => handleViewHistory(vendor)}
            showHistory
            showEdit={false}
            showDelete={false}
          />
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Vendor Wallets
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Export Actions Menu */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu((v) => !v)}
              className="flex items-center justify-center gap-2 w-full sm:w-10 h-10  bg-gray-50 border-1 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
              title="Export options"
            >
              <BsThreeDotsVertical size={18} />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleExportExcel}
                  disabled={excelLoading || pdfLoading}
                  className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                >
                  <FaFileExcel className="text-lg text-emerald-600" />
                  <span>Export to Excel</span>
                  {excelLoading && <Loader2 className="ml-auto text-emerald-600 w-3.5 h-3.5 animate-spin" />}
                </button>

                <button
                  onClick={handleExportPDF}
                  disabled={excelLoading || pdfLoading}
                  className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50"
                >
                  <FaFilePdf className="text-lg text-rose-600" />
                  <span>Export to PDF</span>
                  {pdfLoading && <Loader2 className="ml-auto text-rose-600 w-3.5 h-3.5 animate-spin" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AgGrid Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <AgGridTable
          rowData={vendors}
          columns={columns}
          loading={loading}
          gridHeight={600}
          showCheckboxes={false}
          height={"750px"}
          noRowsMessage="No Vendors found"
        />
      </div>

      {/* Transactions Modal */}
      {showTransactions && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedVendor.vendor_name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedVendor.vendor_email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  {downloading ? "Generating..." : <><MdDownload size={18} /> Download PDF</>}
                </button>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Wallet Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600  mb-1">Current Balance</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{Number(selectedVendor.balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-green-50  rounded-lg p-4">
                  <p className="text-xs text-gray-600  mb-1">Total Credited</p>
                  <p className="text-xl font-bold text-green-600 ">
                    ₹{Number(selectedVendor.total_credited || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-red-50  rounded-lg p-4">
                  <p className="text-xs text-gray-600  mb-1">Total Debited</p>
                  <p className="text-xl font-bold text-red-600 ">
                    ₹{Number(selectedVendor.total_debited || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800  mb-4 flex items-center gap-2">
                  <MdHistory className="w-5 h-5" />
                  Transaction History
                </h3>

                {transactions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((transaction) => {
                      return <div
                        key={transaction._id}
                        className="flex items-center justify-between p-4 bg-gray-50  rounded-lg border border-gray-200 "
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${transaction.type === 'credit'
                                ? 'bg-green-100 '
                                : 'bg-red-100 '
                                }`}
                            >
                              {transaction.type === 'credit' ? (
                                <MdArrowDownward className="w-4 h-4 text-green-600" />
                              ) : (
                                <MdArrowUpward className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 ">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-600 ">
                                {new Date(transaction.date).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${transaction.type === 'credit'
                              ? 'text-green-600 '
                              : 'text-red-600 '
                              }`}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}₹
                            {Number(transaction.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-600 ">
                            {transaction.status}
                          </p>
                        </div>
                      </div>;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 ">No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorWalletsPage;
