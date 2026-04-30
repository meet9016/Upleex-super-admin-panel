"use client";

import React, { useEffect, useState, useRef } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
import StatusBadge from "@/components/common/StatusBadge";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";

type ServicePPlan = {
  _id?: string;
  monthly_price: number | '';
  yearly_price: number | '';
  addon_price: number | '';
  status?: string;
  is_popular?: boolean;
  features?: string[];
};

export default function ServicePriorityTab() {
  const [rows, setRows] = useState<ServicePPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const gridRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [form, setForm] = useState<ServicePPlan>({
    monthly_price: 399,
    yearly_price: 3999,
    addon_price: 129,
    status: "active",
    is_popular: false,
    features: [""],
  });

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllServicePriorityPlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load service priority plans");
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
      monthly_price: 399,
      yearly_price: 3999,
      addon_price: 129,
      status: "active",
      is_popular: false,
      features: [""],
    });
    setErrors({});
  };

  const savePlan = async () => {
    const newErrors: { [k: string]: string } = {};
    if (form.monthly_price === "" || Number(form.monthly_price) < 0)
      newErrors.monthly_price = "Monthly price must be 0 or more";
    if (form.yearly_price === "" || Number(form.yearly_price) < 0)
      newErrors.yearly_price = "Yearly price must be 0 or more";
    if (form.addon_price === "" || Number(form.addon_price) < 0)
      newErrors.addon_price = "Addon price must be 0 or more";
    
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      const payload = { ...form };
      if (editingId) {
        await api.put(`${endPointApi.updateServicePriorityPlan}/${editingId}`, payload);
        toast.success("Service priority plan updated");
      } else {
        await api.post(endPointApi.createServicePriorityPlan, payload);
        toast.success("Service priority plan created");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  const startEdit = (p: ServicePPlan) => {
    setEditingId((p as any)._id || (p as any).id || null);
    setForm({
      monthly_price: p.monthly_price,
      yearly_price: p.yearly_price,
      addon_price: p.addon_price,
      status: p.status || "active",
      is_popular: !!p.is_popular,
      features: p.features || [],
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addFeatureField = () => {
    setForm({ ...form, features: [...(form.features || []), ""] });
  };

  const updateFeatureField = (index: number, value: string) => {
    const updatedFeatures = [...(form.features || [])];
    updatedFeatures[index] = value;
    setForm({ ...form, features: updatedFeatures });
  };

  const removeFeatureField = (index: number) => {
    const updatedFeatures = (form.features || []).filter((_, i) => i !== index);
    setForm({ ...form, features: updatedFeatures });
  };

  const deleteOne = async (plan: ServicePPlan) => {
    const id = plan._id || (plan as any).id;
    if (!id) return;
    if (!confirm("Delete this service priority plan?")) return;
    try {
      await api.delete(`${endPointApi.deleteServicePriorityPlan}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const columns: ColDef[] = [
    {
      field: "monthly_price",
      headerName: "Monthly Price",
      minWidth: 150,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      field: "yearly_price",
      headerName: "Yearly Price",
      minWidth: 150,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      field: "addon_price",
      headerName: "Addon Price",
      minWidth: 150,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />,
    },
    {
      field: "is_popular",
      headerName: "Popular",
      minWidth: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          {params.value ? <span className="text-sm">⭐ Yes</span> : <span className="text-slate-300">No</span>}
        </div>
      ),
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
    },
    {
      headerName: "Action",
      width: 100,
      pinned: "right",
      cellRenderer: (params: any) => (
        <ActionButtons
          onEdit={() => startEdit(params.data)}
          onDelete={() => deleteOne(params.data)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Service Priority Plan" : "Add Service Priority Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Monthly Price <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.monthly_price ? "border-red-500" : "border-slate-200"}`}
                    value={form.monthly_price}
                    onChange={(e) => setForm({ ...form, monthly_price: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                  {errors.monthly_price && <p className="mt-1 text-xs text-red-600">{errors.monthly_price}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Yearly Price <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.yearly_price ? "border-red-500" : "border-slate-200"}`}
                    value={form.yearly_price}
                    onChange={(e) => setForm({ ...form, yearly_price: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                  {errors.yearly_price && <p className="mt-1 text-xs text-red-600">{errors.yearly_price}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Addon Price (Annual Benefit) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.addon_price ? "border-red-500" : "border-slate-200"}`}
                  value={form.addon_price}
                  onChange={(e) => setForm({ ...form, addon_price: e.target.value === '' ? '' : Number(e.target.value) })}
                />
                {errors.addon_price && <p className="mt-1 text-xs text-red-600">{errors.addon_price}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <div className="mt-1">
                  <SearchableDropdown
                    options={statusOptions}
                    value={form.status || ""}
                    placeholder="Select Status"
                    onChange={(val) => setForm({ ...form, status: val as string })}
                  />
                </div>
              </div>

                <div className="flex items-center h-[42px] mb-0.5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!form.is_popular}
                      onCheckedChange={(checked) => setForm({ ...form, is_popular: checked })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">⭐ Popular Plan</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Plan Features
                  </label>
                  <button
                    type="button"
                    onClick={addFeatureField}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white btn-primary font-semibold shadow-sm transition hover:scale-105"
                  >
                    <Plus size={12} /> Add Feature
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {(form.features || []).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 rounded-lg px-3 py-2 border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                        placeholder={`Feature ${index + 1}`}
                        value={feature}
                        onChange={(e) => updateFeatureField(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureField(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(form.features || []).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2 italic">No features added yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={savePlan} className="flex-1 btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update Plan" : "Create Plan"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader><CardTitle>Service Priority Plan List</CardTitle></CardHeader>
            <CardContent className="p-0">
              <AgGridTable
                loading={loading}
                ref={gridRef}
                columns={columns}
                rowData={rows}
                gridHeight={600}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
