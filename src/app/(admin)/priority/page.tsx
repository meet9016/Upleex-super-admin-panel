"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Trash, Edit, Loader2, Plus } from "lucide-react";

type PPlan = {
  _id?: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  product_slots: number;
  status?: string;
  description?: string;
  addon_available_for_yearly?: boolean;
  addon_price_per_year?: number;
  addon_max_slots?: number;
  is_popular?: boolean;
};

export default function PriorityPlansPage() {
  const [rows, setRows] = useState<PPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<string>("");
  const [form, setForm] = useState<PPlan>({
    name: "",
    monthly_price: 0,
    yearly_price: 0,
    product_slots: 1,
    status: "active",
    description: "",
    addon_available_for_yearly: false,
    addon_price_per_year: 0,
    addon_max_slots: 0,
    is_popular: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllPriorityPlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load priority plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setSelectedPlanType("");
    setForm({
      name: "",
      monthly_price: 0,
      yearly_price: 0,
      product_slots: 1,
      status: "active",
      description: "",
      addon_available_for_yearly: false,
      addon_price_per_year: 0,
      addon_max_slots: 0,
      is_popular: false,
    });
  };

  const savePlan = async () => {
    try {
      const payload = { ...form };
      if (editingId) {
        await api.put(`${endPointApi.updatePriorityPlan}/${editingId}`, payload);
        toast.success("Priority plan updated");
      } else {
        await api.post(endPointApi.createPriorityPlan, payload);
        toast.success("Priority plan created");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  const startEdit = (p: PPlan) => {
    setEditingId((p as any)._id || (p as any).id || null);
    setForm({
      name: p.name,
      monthly_price: p.monthly_price,
      yearly_price: p.yearly_price,
      product_slots: p.product_slots,
      status: p.status || "active",
      description: p.description || "",
      addon_available_for_yearly: !!p.addon_available_for_yearly,
      addon_price_per_year: p.addon_price_per_year || 0,
      addon_max_slots: p.addon_max_slots || 0,
      is_popular: !!p.is_popular,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOne = async (plan: PPlan) => {
    const id = plan._id || (plan as any).id;
    if (!id) { toast.error("Invalid plan id"); return; }
    try {
      await api.delete(`${endPointApi.deletePriorityPlan}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const deleteSelected = async () => {
    if (!selected.length) { toast.info("Select rows to delete"); return; }
    if (!confirm(`Delete ${selected.length} selected priority plans?`)) return;
    try {
      for (const r of selected) {
        const id = (r as any)._id || (r as any).id;
        if (id) await api.delete(`${endPointApi.deletePriorityPlan}/${id}`);
      }
      toast.success("Selected plans deleted");
      setSelected([]);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  const columns: ColDef[] = [
    { field: "name", headerName: "Name", minWidth: 160 },
    { field: "monthly_price", headerName: "Monthly", minWidth: 120, valueFormatter: (p)=> `₹${p.value}` },
    { field: "yearly_price", headerName: "Yearly", minWidth: 120, valueFormatter: (p)=> `₹${p.value}` },
    { field: "product_slots", headerName: "Slots", minWidth: 100 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "addon_available_for_yearly", headerName: "Annual Add-on", minWidth: 120, valueFormatter: (p)=> p.value ? 'Yes' : 'No' },
    { field: "addon_price_per_year", headerName: "Add-on Price", minWidth: 120, valueFormatter: (p)=> p.value ? `₹${p.value}` : '-' },
    { field: "addon_max_slots", headerName: "Add-on Slots", minWidth: 120 },
    { field: "is_popular", headerName: "Popular", minWidth: 100, valueFormatter: (p)=> p.value ? '⭐ Yes' : 'No' },
    {
      headerName: "Action",
      minWidth: 140,
      cellRenderer: (params: any) => {
        const row = params.data as PPlan;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 border-2 border-[#4A90E2] text-[#4A90E2]" onClick={()=> startEdit(row)}>
              <Edit size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 border-2 border-[#E55353] text-[#E55353]" onClick={()=> deleteOne(row)}>
              <Trash size={16} />
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Priority Plans (Visibility & Placement)</h2>
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
                <select 
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" 
                  value={selectedPlanType} 
                  onChange={(e)=> {
                    const val = e.target.value;
                    setSelectedPlanType(val);
                    setForm({ ...form, name: val.charAt(0).toUpperCase() + val.slice(1) });
                    if (val === "premium") {
                      setForm(prev => ({ ...prev, addon_available_for_yearly: true }));
                    } else {
                      setForm(prev => ({ ...prev, addon_available_for_yearly: false, addon_price_per_year: 0, addon_max_slots: 0 }));
                    }
                  }}
                >
                  <option value="">Select Plan Type</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Monthly Price</label>
                  <input type="number" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" value={form.monthly_price} onChange={(e)=> setForm({ ...form, monthly_price: Number(e.target.value||0) })} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Yearly Price</label>
                  <input type="number" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" value={form.yearly_price} onChange={(e)=> setForm({ ...form, yearly_price: Number(e.target.value||0) })} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Product Slots</label>
                  <input type="number" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" value={form.product_slots} onChange={(e)=> setForm({ ...form, product_slots: Number(e.target.value||1) })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" value={form.status} onChange={(e)=> setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" rows={3} value={form.description} onChange={(e)=> setForm({ ...form, description: e.target.value })} />
              </div>
              {selectedPlanType === "premium" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-sm font-semibold text-slate-700">Annual Add-on</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="checkbox" 
                        checked={!!form.addon_available_for_yearly} 
                        onChange={(e)=> setForm({ ...form, addon_available_for_yearly: e.target.checked })} 
                      />
                      <span className="text-sm text-slate-600">Available for Yearly</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Add-on Price/Year</label>
                    <input 
                      type="number" 
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" 
                      value={form.addon_price_per_year} 
                      onChange={(e)=> setForm({ ...form, addon_price_per_year: Number(e.target.value||0) })} 
                      disabled={!form.addon_available_for_yearly}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Add-on Max Slots</label>
                    <input 
                      type="number" 
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" 
                      value={form.addon_max_slots} 
                      onChange={(e)=> setForm({ ...form, addon_max_slots: Number(e.target.value||0) })} 
                      disabled={!form.addon_available_for_yearly}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700">Mark as Popular</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <input type="checkbox" checked={!!form.is_popular} onChange={(e)=> setForm({ ...form, is_popular: e.target.checked })} />
                  <span className="text-sm text-slate-700">⭐ Show as popular plan (only one can be popular)</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={savePlan} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update Priority Plan" : "Create Priority Plan"}
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
              onSelectionChange={(sel: any[]) => setSelected(sel as PPlan[])}
              enableFilter={false}
              enableSearch={false}
              tableName="Priority Plans"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
