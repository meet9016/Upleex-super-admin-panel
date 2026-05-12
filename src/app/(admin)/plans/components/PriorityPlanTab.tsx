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
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageLoader from "@/components/common/PageLoader";
import { Checkbox } from "@/components/ui/Checkbox";


type PPlan = {
  _id?: string;
  name: string;
  monthly_price: number | '';
  yearly_price: number | '';
  product_slots: number | '';
  status?: string;
  is_popular?: boolean;
  addon_available_for_yearly?: boolean;
  addon_price_per_year?: number;
  addon_max_slots?: number;
  unlimited_amount_monthly?: number | '';
  extra_product_price_monthly?: number | '';
  unlimited_amount_yearly?: number | '';
  extra_product_price_yearly?: number | '';
  free_listing?: boolean;
  features?: string[];
};

export default function PriorityPlanTab() {
  const [rows, setRows] = useState<PPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PPlan[]>([]);
  const gridRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<string>("");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [form, setForm] = useState<PPlan>({
    name: "",
    monthly_price: 0,
    yearly_price: 0,
    product_slots: 1,
    status: "active",
    is_popular: false,
    addon_available_for_yearly: true,
    addon_price_per_year: 0,
    addon_max_slots: 0,
    unlimited_amount_monthly: 0,
    extra_product_price_monthly: 0,
    unlimited_amount_yearly: 0,
    extra_product_price_yearly: 0,
    free_listing: false,
    features: [""],
  });

  const planTypeOptions = [
    { label: "Basic", value: "basic" },
    { label: "Standard", value: "standard" },
    { label: "Premium", value: "premium" },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

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

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setSelectedPlanType("");
    setForm({
      name: "",
      monthly_price: 0,
      yearly_price: 0,
      product_slots: 1,
      status: "active",
      is_popular: false,
      addon_available_for_yearly: true,
      addon_price_per_year: 0,
      addon_max_slots: 0,
      unlimited_amount_monthly: 0,
      extra_product_price_monthly: 0,
      unlimited_amount_yearly: 0,
      extra_product_price_yearly: 0,
      features: [""],
    });
    setErrors({});
  };

  const savePlan = async () => {
    const newErrors: { [k: string]: string } = {};
    if (!String(form.name || "").trim()) newErrors.name = "Plan name is required";
    if (form.monthly_price === "" || Number(form.monthly_price) < 0)
      newErrors.monthly_price = "Monthly price must be 0 or more";
    if (form.yearly_price === "" || Number(form.yearly_price) < 0)
      newErrors.yearly_price = "Yearly price must be 0 or more";
    if (form.product_slots === "" || Number(form.product_slots) < 1)
      newErrors.product_slots = "Slots must be at least 1";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      const payload = { ...form, name: String(form.name).trim(), addon_available_for_yearly: true };
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
      is_popular: !!p.is_popular,
      addon_available_for_yearly: p.addon_available_for_yearly,
      addon_price_per_year: p.addon_price_per_year,
      addon_max_slots: p.addon_max_slots,
      unlimited_amount_monthly: p.unlimited_amount_monthly || 0,
      extra_product_price_monthly: p.extra_product_price_monthly || 0,
      unlimited_amount_yearly: p.unlimited_amount_yearly || 0,
      extra_product_price_yearly: p.extra_product_price_yearly || 0,
      free_listing: !!p.free_listing,
      features: p.features && p.features.length ? p.features : [""],
    });
    setSelectedPlanType(p.name.toLowerCase());
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

  const deleteOne = async (plan: PPlan) => {
    const id = plan._id || (plan as any).id;
    if (!id) {
      toast.error("Invalid plan id");
      return;
    }
    try {
      await api.delete(`${endPointApi.deletePriorityPlan}/${id}`);
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
    if (!confirm(`Delete ${selected.length} selected priority plans?`)) return;
    try {
      for (const r of selected) {
        const id = (r as any)._id || (r as any).id;
        if (id) await api.delete(`${endPointApi.deletePriorityPlan}/${id}`);
      }
      toast.success("Selected plans deleted");
      setSelected([]);
      gridRef.current?.api?.deselectAll();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk delete failed");
    }
  };

  const PopularCellRenderer = (params: any) => {
    return (
      <div className="flex items-center justify-center h-full">
        {params.value ? <span className="text-sm">⭐ Yes</span> : <span className="text-slate-300">No</span>}
      </div>
    );
  };

  const columns: ColDef[] = [
    { field: "name", headerName: "Name", minWidth: 160 },
    {
      field: "monthly_price",
      headerName: "Monthly",
      minWidth: 100,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      field: "yearly_price",
      headerName: "Yearly",
      minWidth: 100,
      valueFormatter: (p) => `₹${p.value}`,
    },
    { field: "product_slots", headerName: "Slots", minWidth: 100 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />,
    },
    {
      field: "is_popular",
      headerName: "Popular",
      minWidth: 80,
      cellRenderer: PopularCellRenderer,
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
    },
    {
      field: "addon_available_for_yearly",
      headerName: "Annual Addon",
      minWidth: 120,
      cellRenderer: (params: any) => params.value ? "Available" : "No",
    },
    {
      field: "unlimited_amount_monthly",
      headerName: "Unlimited (M)",
      minWidth: 120,
      valueFormatter: (p) => `₹${p.value || 0}`,
    },
    {
      field: "extra_product_price_monthly",
      headerName: "Extra Prod (M)",
      minWidth: 120,
      valueFormatter: (p) => `₹${p.value || 0}`,
    },
    {
      field: "unlimited_amount_yearly",
      headerName: "Unlimited (Y)",
      minWidth: 120,
      valueFormatter: (p) => `₹${p.value || 0}`,
    },
    {
      field: "extra_product_price_yearly",
      headerName: "Extra Prod (Y)",
      minWidth: 120,
      valueFormatter: (p) => `₹${p.value || 0}`,
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
        <ActionButtons
          onEdit={() => startEdit(params.data)}
          onDelete={() => deleteOne(params.data)}
        />
      ),
    },
  ];


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 lg:grid-cols-3 items-stretch" style={{ height: "770px" }}>
        <div className="lg:col-span-1 h-full">
          <Card className="sticky top-16 border-slate-200 h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Priority Plan" : "Add Priority Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm font-semibold text-slate-700">Plan Type <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  <div className={`rounded-lg ${errors.name ? "ring-1 ring-red-500" : ""}`}>
                    <SearchableDropdown
                      searchable
                      options={planTypeOptions}
                      value={selectedPlanType}
                      placeholder="Select Plan Type"
                      onChange={(value) => {
                        const val = value as string;
                        setSelectedPlanType(val);
                        setForm({ ...form, name: val.charAt(0).toUpperCase() + val.slice(1) });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                        setForm((prev) => ({ ...prev, name: val.charAt(0).toUpperCase() + val.slice(1), addon_available_for_yearly: true }));
                      }}
                    />
                  </div>
                  {errors.name ? (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Monthly Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.monthly_price ? "border-red-500 focus:ring-red-200" : "border-slate-200"}`}
                    value={form.monthly_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setForm({ ...form, monthly_price: "" as any });
                        return;
                      }
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 999999) {
                        setForm({ ...form, monthly_price: numValue });
                        if (errors.monthly_price)
                          setErrors((prev) => ({ ...prev, monthly_price: "" }));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setForm({ ...form, monthly_price: 0 });
                      }
                    }}
                  />
                  {errors.monthly_price ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.monthly_price}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Yearly Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.yearly_price ? "border-red-500 focus:ring-red-200" : "border-slate-200"}`}
                    value={form.yearly_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setForm({ ...form, yearly_price: "" as any });
                        return;
                      }
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 999999) {
                        setForm({ ...form, yearly_price: numValue });
                        if (errors.yearly_price)
                          setErrors((prev) => ({ ...prev, yearly_price: "" }));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setForm({ ...form, yearly_price: 0 });
                      }
                    }}
                  />
                  {errors.yearly_price ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.yearly_price}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Slots <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="999999"
                    step="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.product_slots ? "border-red-500 focus:ring-red-200" : "border-slate-200"}`}
                    value={form.product_slots}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setForm({ ...form, product_slots: "" as any });
                        return;
                      }
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 999999) {
                        setForm({ ...form, product_slots: numValue });
                        if (errors.product_slots)
                          setErrors((prev) => ({ ...prev, product_slots: "" }));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setForm({ ...form, product_slots: 1 });
                      }
                    }}
                  />
                  {errors.product_slots ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.product_slots}
                    </p>
                  ) : null}
                </div>
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

                <div className="flex items-center h-[42px] mb-0.5 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!form.is_popular}
                      onCheckedChange={(checked) => setForm({ ...form, is_popular: checked })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      ⭐ Popular Plan
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!form.free_listing}
                      onCheckedChange={(checked) => setForm({ ...form, free_listing: !!checked })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      🆓 Free Listing
                    </span>
                  </div>
                </div>
              </div>

              {selectedPlanType === 'premium' && (
                <div className="space-y-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2">
                    Premium Extras (Extra Product & Unlimited)
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Monthly Extras */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Monthly Options</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600">Extra Prod Price (M)</label>
                          <input
                            type="number"
                            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={form.extra_product_price_monthly}
                            onChange={(e) => setForm({ ...form, extra_product_price_monthly: Number(e.target.value || 0) })}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600">Unlimited Amt (M)</label>
                          <input
                            type="number"
                            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={form.unlimited_amount_monthly}
                            onChange={(e) => setForm({ ...form, unlimited_amount_monthly: Number(e.target.value || 0) })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Yearly Extras */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Yearly Options</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600">Extra Prod Price (Y)</label>
                          <input
                            type="number"
                            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={form.extra_product_price_yearly}
                            onChange={(e) => setForm({ ...form, extra_product_price_yearly: Number(e.target.value || 0) })}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600">Unlimited Amt (Y)</label>
                          <input
                            type="number"
                            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={form.unlimited_amount_yearly}
                            onChange={(e) => setForm({ ...form, unlimited_amount_yearly: Number(e.target.value || 0) })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}




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
                  {editingId ? "Update Priority Plan" : "Create Priority Plan"}
                </Button>
                <Button variant="outline" className="flex-1 border-slate-300" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            {/* </div> */}
          </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 h-full">
          <Card className="border-slate-200 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Plan List</CardTitle>
              <Button
                size="md"
                variant="destructive"
                disabled={!selected.length || loading}
                onClick={deleteSelected}
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
                onSelectionChange={(sel: any[]) => setSelected(sel as PPlan[])}
                tableName="Priority Plans"
                gridHeight={700}
                noRowsMessage="No priority plan found"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
