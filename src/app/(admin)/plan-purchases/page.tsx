"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Trash, Loader2 } from "lucide-react";

type Purchase = {
  _id?: string;
  id?: string;
  vendor_id: string;
  plan_type: string;
  months: number;
  max_products: number;
  amount: number;
  product_ids: string[];
  start_at?: string;
  expire_at?: string;
  createdAt?: string;
};

export default function ListingPlanPurchasesPage() {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Purchase[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllListingPlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load plan purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteOne = async (row: Purchase) => {
    const id = row._id || row.id;
    if (!id) {
      toast.error("Invalid purchase id");
      return;
    }
    try {
      await api.delete(`${endPointApi.deleteListingPlan}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const deleteSelected = async () => {
    if (!selected.length) {
      toast.info("Select rows to delete");
      return;
    }
    if (!confirm(`Delete ${selected.length} selected purchases?`)) return;
    try {
      for (const r of selected) {
        const id = r._id || r.id;
        if (id) {
          await api.delete(`${endPointApi.deleteListingPlan}/${id}`);
        }
      }
      toast.success("Selected purchases deleted");
      setSelected([]);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  const columns: ColDef[] = [
    { field: "vendor_name", headerName: "Vendor", minWidth: 220 },
    { field: "plan_type", headerName: "Plan", minWidth: 120 },
    { field: "months", headerName: "Months", minWidth: 100 },
    { field: "max_products", headerName: "Max Products", minWidth: 120 },
    { field: "amount", headerName: "Amount", minWidth: 120, valueFormatter: (p) => `₹${p.value}` },
    { field: "product_ids", headerName: "Products", minWidth: 140, valueGetter: (p: any) => (p.data?.product_ids?.length || 0) },
    { field: "start_at", headerName: "Start", minWidth: 140, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-" },
    { field: "expire_at", headerName: "Expire", minWidth: 140, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-" },
    { field: "createdAt", headerName: "Created", minWidth: 140, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-" },
    {
      headerName: "Action",
      minWidth: 120,
      cellRenderer: (params: any) => {
        const row = params.data as Purchase;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
            onClick={() => deleteOne(row)}
            title="Delete"
          >
            <Trash size={16} />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Listing Plan Purchases</h2>
        <Button
          variant="destructive"
          disabled={!selected.length || loading}
          onClick={deleteSelected}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Delete Selected ({selected.length})
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-2">
        <AgGridTable
          columns={columns}
          rowData={rows}
          onSelectionChange={(sel: any[]) => setSelected(sel as Purchase[])}
          enableFilter={false}
          enableSearch={false}
          tableName="Purchases"
        />
      </div>
    </div>
  );
}
