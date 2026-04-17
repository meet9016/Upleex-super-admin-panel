"use client";

import React, { useEffect, useState, useRef } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus } from "lucide-react";
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
      addon_available_for_yearly: true,
      addon_price_per_year: p.addon_price_per_year || 0,
      addon_max_slots: p.addon_max_slots || 0,
    });
    setSelectedPlanType(p.name.toLowerCase());
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const isPopular = params.value;
    return (
      <div className="flex items-center justify-center h-full">
        <Checkbox
          checked={isPopular}
          disabled={true}
        />
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

              <div className="grid grid-cols-1 gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <label className="text-sm font-bold text-indigo-700">
                  Annual Benefit (Duration Add-on)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Price per Year (₹)
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={form.addon_price_per_year}
                      onChange={(e) =>
                        setForm({ ...form, addon_price_per_year: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Max Product Slots
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={form.addon_max_slots}
                      onChange={(e) =>
                        setForm({ ...form, addon_max_slots: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                </div>
              </div>


              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Mark as Popular
                </label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Checkbox
                    checked={!!form.is_popular}
                    onCheckedChange={(checked) => setForm({ ...form, is_popular: checked })}
                    className="border-yellow-300 text-yellow-500"
                  />
                  <span className="text-sm text-slate-700">
                    ⭐ Show as popular plan (only one can be popular)
                  </span>
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
                noRowsMessage="No Plan found"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
