"use client";

import React, { useEffect, useState, useRef } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
import StatusBadge from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import { Checkbox } from "@/components/ui/Checkbox";


type GPlan = {
  _id?: string;
  plan_type: string;
  max_products: number | '';
  amount: number | '';
  status?: string;
  popular?: boolean;
};

export default function GeneralPlanTab() {
  const [rows, setRows] = useState<GPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<GPlan[]>([]);
  const gridRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<GPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [form, setForm] = useState<GPlan>({
    plan_type: "",
    max_products: 1,
    amount: 0,
    status: "active",
    popular: false,
  });
  
  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" }
  ];
  
  const planTypeOptions = [
    { label: "Basic", value: "basic" },
    { label: "Standard", value: "standard" },
    { label: "Premium", value: "premium" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllGeneralPlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load general plans");
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
      max_products: 1,
      amount: 0,
      status: "active",
      popular: false,
    });
  };

  const savePlan = async () => {
    const newErrors: { [k: string]: string } = {};
    if (!String(form.plan_type || '').trim()) newErrors.plan_type = 'Plan type is required';
    if (form.max_products === '' || Number(form.max_products) < 1) newErrors.max_products = 'Max products must be at least 1';
    if (form.amount === '' || Number(form.amount) < 0) newErrors.amount = 'Amount must be 0 or more';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});
    
    try {
      const payload = {
        plan_type: String(form.plan_type).trim(),
        max_products: Number(form.max_products),
        amount: Number(form.amount),
        status: form.status || "active",
        popular: !!form.popular,
      };
      
      if (editingId) {
        const res = await api.put(`${endPointApi.updateGeneralPlan}/${editingId}`, payload);
        if (res?.data) toast.success("General Plan updated");
      } else {
        const res = await api.post(endPointApi.createGeneralPlan, payload);
        if (res?.data) toast.success("General Plan created");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  const startEdit = (p: GPlan) => {
    setEditingId((p as any)._id || (p as any).id || null);
    setForm({
      plan_type: p.plan_type,
      max_products: p.max_products,
      amount: p.amount,
      status: p.status || "active",
      popular: !!p.popular,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const handleDeleteClick = (plan: GPlan) => {
    setPlanToDelete(plan);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    const id = planToDelete._id || (planToDelete as any).id;
    if (!id) {
      toast.error("Invalid plan id");
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`${endPointApi.deleteGeneralPlan}/${id}`);
      toast.success("Deleted successfully");

      if (editingId === id) {
        resetForm();
      }

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

  const deleteOne = async (plan: GPlan) => {
    handleDeleteClick(plan);
  };

  const deleteSelected = async () => {
    if (!selected.length) {
      toast.info("Select rows to delete");
      return;
    }
    if (!confirm(`Delete ${selected.length} selected general plans?`)) return;
    try {
      for (const r of selected) {
        const id = (r as any)._id || (r as any).id;
        if (id) {
          await api.delete(`${endPointApi.deleteGeneralPlan}/${id}`);
        }
      }
      toast.success("Selected plans deleted");
      setSelected([]);
      gridRef.current?.api?.deselectAll();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  const columns: ColDef[] = [
    { field: "plan_type", headerName: "Plan Type", minWidth: 160 },
    { field: "max_products", headerName: "Max Products", minWidth: 100 },
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
      field: "popular",
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
      minWidth: 100,
      maxWidth: 100,
      pinned: "right",
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" },
      cellRenderer: (params: any) => (
        <ActionButtons onEdit={() => startEdit(params.data)} onDelete={() => deleteOne(params.data)} />
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="grid gap-6 lg:grid-cols-3 items-stretch" style={{ height: '770px' }}>
        {/* LEFT FORM */}
        <div className="lg:col-span-1">
          <Card className="sticky top-16 border-slate-200 h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit General Plan" : "Add General Plan"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 overflow-y-auto">
              {/* Plan Type */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Plan Type <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <SearchableDropdown
                    options={planTypeOptions}
                    value={form.plan_type}
                    placeholder="Select Plan Type"
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setForm({ ...form, plan_type: v });
                      if (errors.plan_type && v) setErrors(prev => ({ ...prev, plan_type: '' }));
                    }}
                  />
                </div>
                {errors.plan_type ? (<p className="mt-1 text-xs text-red-600">{errors.plan_type}</p>) : null}
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Max Products <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.max_products ? 'border-red-500 focus:ring-0' : 'border-slate-200'}`}
                    value={form.max_products}
                    onChange={(e) => setForm({ ...form, max_products: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.amount ? 'border-red-500 focus:ring-0' : 'border-slate-200'}`}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <div className="mt-1">
                    <SearchableDropdown
                      options={statusOptions}
                      value={form.status ?? 'active'}
                      placeholder="Select Status"
                      onChange={(val) =>
                        setForm({ ...form, status: Array.isArray(val) ? val[0] : val })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center h-[42px] mb-0.5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!form.popular}
                      onCheckedChange={(checked) => setForm({ ...form, popular: !!checked })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">⭐ Popular</span>
                  </div>
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

        {/* TABLE */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 overflow-hidden flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between text-sm ">
              <CardTitle>General Plan List</CardTitle>
              <Button
                size="md"
                variant="destructive"
                disabled={!selected.length || loading}
                onClick={deleteSelected}
                className="text-sm"
              >
                Delete Selected ({selected.length})
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <AgGridTable
                loading={loading}
                ref={gridRef}
                columns={columns}
                rowData={rows}
                onSelectionChange={(sel: any[]) => setSelected(sel as GPlan[])}
                enableFilter={false}
                enableSearch={false}
                tableName="General Plans"
                gridHeight={700}
                noRowsMessage="No general plan found"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Plan?"
        description={planToDelete ? `Are you sure you want to delete "${planToDelete.plan_type}" general plan?` : ""}
        isLoading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
