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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import { Checkbox } from "@/components/ui/Checkbox";

type ServicePlan = {
  _id?: string;
  plan_name: string;
  months: number | '';
  amount: number | '';
  max_services: number | '';
  status?: string;
  is_popular?: boolean;
  features?: string[];
};

export default function ServiceListingTab() {
  const [rows, setRows] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ServicePlan[]>([]);
  const gridRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<ServicePlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [form, setForm] = useState<ServicePlan>({
    plan_name: "",
    months: 1,
    amount: 0,
    max_services: 0,
    status: "active",
    is_popular: false,
    features: [""],
  });
  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllServicePlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load service plans");
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
      plan_name: "",
      months: 1,
      amount: 0,
      max_services: 0,
      status: "active",
      is_popular: false,
      features: [""],
    });
    setErrors({});
  };

  const savePlan = async () => {
    const newErrors: { [k: string]: string } = {};
    if (!String(form.plan_name || '').trim()) newErrors.plan_name = 'Plan name is required';
    if (form.months === '' || Number(form.months) < 1) newErrors.months = 'Months must be at least 1';
    if (form.amount === '' || Number(form.amount) < 0) newErrors.amount = 'Amount must be 0 or more';
    if (form.max_services === '' || Number(form.max_services) < 0) newErrors.max_services = 'Max services must be 0 or more';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});
    try {
      const payload = {
        plan_name: String(form.plan_name).trim(),
        months: Number(form.months),
        amount: Number(form.amount),
        max_services: Number(form.max_services),
        status: form.status || "active",
        is_popular: !!form.is_popular,
        features: form.features || [],
      };
      if (editingId) {
        const res = await api.put(`${endPointApi.updateServicePlan}/${editingId}`, payload);
        if (res?.data) toast.success("Service plan updated");
      } else {
        const res = await api.post(endPointApi.createServicePlan, payload);
        if (res?.data) toast.success("Service plan created");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  const startEdit = (p: ServicePlan) => {
    setEditingId((p as any)._id || (p as any).id || null);
    setForm({
      plan_name: p.plan_name,
      months: p.months,
      amount: p.amount,
      max_services: p.max_services,
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

  const handleDeleteClick = (plan: ServicePlan) => {
    setPlanToDelete(plan);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    const id = planToDelete._id || (planToDelete as any).id;
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(`${endPointApi.deleteServicePlan}/${id}`);
      toast.success("Deleted successfully");
      if (editingId === id) resetForm();
      setShowDeletePopup(false);
      setPlanToDelete(null);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setPlanToDelete(null);
  };

  const columns: ColDef[] = [
    { field: "plan_name", headerName: "Plan Name", minWidth: 160 },
    { field: "months", headerName: "Months", minWidth: 100 },
    { field: "max_services", headerName: "Max Services", minWidth: 120, valueFormatter: (p) => p.value === 0 ? 'Unlimited' : p.value },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 100,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 100,
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
        <ActionButtons onEdit={() => startEdit(params.data)} onDelete={() => handleDeleteClick(params.data)} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Service Plan" : "Add Service Plan"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Plan Name <span className="text-red-500">*</span></label>
                <input
                  className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.plan_name ? 'border-red-500 focus:ring-0' : 'border-slate-200'}`}
                  value={form.plan_name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, plan_name: v });
                    if (errors.plan_name && v.trim()) setErrors(prev => ({ ...prev, plan_name: '' }));
                  }}
                />
                {errors.plan_name ? (<p className="mt-1 text-xs text-red-600">{errors.plan_name}</p>) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Months <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.months ? 'border-red-500 focus:ring-0' : 'border-slate-200'}`}
                    value={form.months}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, months: v === '' ? '' : Number(v) });
                      if (errors.months && v !== '' && Number(v) >= 1) setErrors(prev => ({ ...prev, months: '' }));
                    }}
                  />
                  {errors.months ? (<p className="mt-1 text-xs text-red-600">{errors.months}</p>) : null}
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.amount ? 'border-red-500 focus:ring-0' : 'border-slate-200'}`}
                    value={form.amount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, amount: v === '' ? '' : Number(v) });
                      if (errors.amount && v !== '' && Number(v) >= 0) setErrors(prev => ({ ...prev, amount: '' }));
                    }}
                  />
                  {errors.amount ? (<p className="mt-1 text-xs text-red-600">{errors.amount}</p>) : null}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Max Services <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.max_services ? 'border-red-500 focus:ring-0' : 'border-slate-200'}`}
                  value={form.max_services}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, max_services: v === '' ? '' : Number(v) });
                    if (errors.max_services && v !== '' && Number(v) >= 0) setErrors(prev => ({ ...prev, max_services: '' }));
                  }}
                />
                <p className="text-[10px] text-slate-400 mt-1">Enter 0 for unlimited services</p>
                {errors.max_services ? (<p className="mt-1 text-xs text-red-600">{errors.max_services}</p>) : null}
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <div className="mt-1">
                  <SearchableDropdown
                    options={statusOptions}
                    value={form.status ?? 'active'}
                    placeholder="Select Status"
                    onChange={(val) => setForm({ ...form, status: Array.isArray(val) ? val[0] : val })}
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
                <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Service Plan List</CardTitle></CardHeader>
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
      <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Service Plan?"
        description={planToDelete ? `Are you sure you want to delete "${planToDelete.plan_name}"?` : ""}
        isLoading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
