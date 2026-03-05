"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Trash, Edit, Loader2, Plus } from "lucide-react";

type Plan = {
  _id?: string;
  plan_type: string;
  months: number;
  max_products: number;
  amount: number;
  status?: string;
  description?: string;
  popular?: boolean;
};

export default function PlansPage() {
  const [rows, setRows] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Plan>({
    plan_type: "",
    months: 1,
    max_products: 1,
    amount: 0,
    status: "active",
    description: "",
    popular: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllPlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      plan_type: "",
      months: 1,
      max_products: 1,
      amount: 0,
      status: "active",
      description: "",
    });
  };

  const savePlan = async () => {
    try {
      const payload = {
        plan_type: form.plan_type,
        months: Number(form.months),
        max_products: Number(form.max_products),
        amount: Number(form.amount),
        status: form.status || "active",
        description: form.description || "",
        popular: !!form.popular,
      };
      if (editingId) {
        const res = await api.put(`${endPointApi.updatePlan}/${editingId}`, payload);
        if (res?.data) toast.success("Plan updated");
      } else {
        const res = await api.post(endPointApi.createPlan, payload);
        if (res?.data) toast.success("Plan created");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  const startEdit = (p: Plan) => {
    setEditingId(p._id || null);
    setForm({
      plan_type: p.plan_type,
      months: p.months,
      max_products: p.max_products,
      amount: p.amount,
      status: p.status || "active",
      description: p.description || "",
      popular: !!p.popular,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOne = async (plan: Plan) => {
    const id = plan._id || (plan as any).id;
    if (!id) {
      toast.error("Invalid plan id");
      return;
    }
    try {
      await api.delete(`${endPointApi.deletePlan}/${id}`);
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
    if (!confirm(`Delete ${selected.length} selected plans?`)) return;
    try {
      for (const r of selected) {
        const id = (r as any)._id || (r as any).id;
        if (id) {
          await api.delete(`${endPointApi.deletePlan}/${id}`);
        }
      }
      toast.success("Selected plans deleted");
      setSelected([]);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  const columns: ColDef[] = [
    { field: "plan_type", headerName: "Plan Type", minWidth: 160 },
    { field: "months", headerName: "Months", minWidth: 100 },
    { field: "max_products", headerName: "Max Products", minWidth: 130 },
    { field: "amount", headerName: "Amount", minWidth: 120, valueFormatter: (p) => `₹${p.value}` },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "popular", headerName: "Popular", minWidth: 100, valueFormatter: (p)=> p.value ? 'Yes' : 'No' },
    { field: "description", headerName: "Description", minWidth: 200 },
    {
      headerName: "Action",
      minWidth: 140,
      cellRenderer: (params: any) => {
        const row = params.data as Plan;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white transition"
              onClick={() => startEdit(row)}
              title="Edit"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
              onClick={() => deleteOne(row)}
              title="Delete"
            >
              <Trash size={16} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Plans</h2>
        <Button variant="destructive" disabled={!selected.length || loading} onClick={deleteSelected}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Delete Selected ({selected.length})
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Plan Type</label>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={form.plan_type}
                  onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                  placeholder="basic / standard / premium / custom"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Months</label>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={form.months}
                    onChange={(e) => setForm({ ...form, months: Number(e.target.value || 1) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Max Products</label>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={form.max_products}
                    onChange={(e) => setForm({ ...form, max_products: Number(e.target.value || 1) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Amount</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value || 0) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Popular</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={!!form.popular}
                      onChange={(e)=> setForm({ ...form, popular: e.target.checked })}
                    />
                    <span className="text-sm text-slate-600">Mark plan as Popular</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={savePlan} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update Plan" : "Create Plan"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-2">
            <AgGridTable
              columns={columns}
              rowData={rows}
              onSelectionChange={(sel: any[]) => setSelected(sel as Plan[])}
              enableFilter={false}
              enableSearch={false}
              tableName="Plans"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
