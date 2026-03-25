'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/utils/axiosInstance';   // ← Your axios instance
import endPointApi from '@/utils/endPointApi';
import { toast } from 'react-toastify';
import { MdWallet, MdHistory, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import AgGridTable from '@/components/ui/AgGridTable';
import ActionButtons from '@/components/common/ActionButtons';
import { ColDef } from 'ag-grid-community';

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
  createdAt: string;
}

const VendorWalletsPage = () => {
  const [vendors, setVendors] = useState<VendorWallet[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all vendor wallets (same pattern as fetchVendorsWithServices)
  const fetchVendorWallets = async () => {
    try {
      setLoading(true);
      const res = await api.get(endPointApi.getAllVendorWallets);

      const wallets = res?.data?.data?.wallets || [];
      const walletsWithId = wallets.map((wallet: VendorWallet) => ({
        ...wallet,
        id: wallet._id,
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

      setTransactions(res?.data?.data?.transactions || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorWallets();
  }, []);

  const handleViewHistory = (vendor: VendorWallet) => {
    setSelectedVendor(vendor);
    setShowTransactions(true);
    fetchVendorTransactions(vendor.vendor_id);
  };

  const filteredVendors = useMemo(() => 
    vendors.filter(vendor =>
      vendor.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendor_email?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [vendors, searchTerm]
  );

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Vendor Wallets
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage and monitor vendor wallet balances
        </p>
      </div>

      {/* AgGrid Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <AgGridTable
          rowData={filteredVendors}
          columns={columns}
          enableSearch
          onSearchChange={setSearchTerm}
          loading={loading}
          gridHeight={600}
        />
      </div>

      {/* Transactions Modal */}
      {showTransactions && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {selectedVendor.vendor_name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedVendor.vendor_email}
                </p>
              </div>
              <button
                onClick={() => setShowTransactions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Wallet Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(selectedVendor.balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Credited</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ₹{Number(selectedVendor.total_credited || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Debited</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    ₹{Number(selectedVendor.total_debited || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <MdHistory className="w-5 h-5" />
                  Transaction History
                </h3>

                {transactions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                transaction.type === 'credit'
                                  ? 'bg-green-100 dark:bg-green-900/20'
                                  : 'bg-red-100 dark:bg-red-900/20'
                              }`}
                            >
                              {transaction.type === 'credit' ? (
                                <MdArrowDownward className="w-4 h-4 text-green-600" />
                              ) : (
                                <MdArrowUpward className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(transaction.createdAt).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${
                              transaction.type === 'credit'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}₹
                            {Number(transaction.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVendors.length === 0 && !loading && (
        <div className="text-center py-12">
          <MdWallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No vendors found matching your search' : 'No vendor wallets found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorWalletsPage;
