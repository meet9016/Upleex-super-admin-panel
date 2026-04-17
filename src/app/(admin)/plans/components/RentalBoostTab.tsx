"use client";

import React, { useEffect, useState, useRef } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Rocket } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
import StatusBadge from "@/components/common/StatusBadge";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";

type RPlan = {
  _id?: string;
  name: string;
  days: number | '';
  price: number | '';
  status: string;
  is_popular: boolean;
};

export default function RentalBoostTab() {
  const [rows, setRows] = useState<RPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RPlan[]>([]);
  const gridRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [form, setForm] = useState<RPlan>({
    name: "",
    days: 7,
    price: 39,
    status: "active",
    is_popular: false,
  });

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endPointApi.getAllRentalBoostPlans);
      const list = res?.data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load boost plans");
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
      name: "",
      days: 7,
      price: 39,
      status: "active",
      is_popular: false,
    });
    setErrors({});
  };

  const savePlan = async () => {
    const newErrors: { [k: string]: string } = {};
    // if (!String(form.name || "").trim()) newErrors.name = "Plan name is required";
    if (form.days === "" || Number(form.days) < 1) newErrors.days = "Days must be at least 1";
    if (form.price === "" || Number(form.price) < 0) newErrors.price = "Price must be 0 or more";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      if (editingId) {
        await api.put(`${endPointApi.updateRentalBoostPlan}/${editingId}`, form);
        toast.success("Rental boost plan updated");
      } else {
        await api.post(endPointApi.createRentalBoostPlan, form);
        toast.success("Rental boost plan created");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  const startEdit = (p: RPlan) => {
    setEditingId(p._id || (p as any).id || null);
    setForm({
      name: p.name,
      days: p.days,
      price: p.price,
      status: p.status || "active",
      is_popular: !!p.is_popular,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOne = async (p: RPlan) => {
    const id = p._id || (p as any).id;
    if (!id) return;
    try {
      await api.delete(`${endPointApi.deleteRentalBoostPlan}/${id}`);
      toast.success("Plan deleted");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const columns: ColDef[] = [
    { field: "name", headerName: "Plan Name", minWidth: 160 },
    { field: "days", headerName: "Duration (Days)", minWidth: 120 },
    {
      field: "price",
      headerName: "Price",
      minWidth: 100,
      valueFormatter: (p) => `₹${p.value}`
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
          <Checkbox checked={params.value} disabled />
        </div>
      )
    },
    {
      headerName: "Action",
      width: 100,
      pinned: "right",
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
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
      <div className="grid gap-6 lg:grid-cols-3 items-stretch" style={{ height: "700px" }}>
        <div className="lg:col-span-1 h-full">
          <Card className="sticky top-16 border-slate-200 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-indigo-600" />
                {editingId ? "Edit Boost Plan" : "Add Boost Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm font-semibold text-slate-700">Plan Name</label>
                <input
                  className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.name ? "border-red-500" : "border-slate-200"}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 7 Days Boost"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Duration (Days) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.days ? "border-red-500" : "border-slate-200"}`}
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
                  />
                  {errors.days && <p className="mt-1 text-xs text-red-600">{errors.days}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Price (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.price ? "border-red-500" : "border-slate-200"}`}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <div className="mt-1">
                  <SearchableDropdown
                    options={statusOptions}
                    value={form.status}
                    onChange={(val) => setForm({ ...form, status: val as string })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <Checkbox
                    checked={form.is_popular}
                    onCheckedChange={(checked) => setForm({ ...form, is_popular: !!checked })}
                  />
                  <span className="text-sm text-slate-700 font-medium">Mark as Popular Plan</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={savePlan} className="flex-1 btn-primary">
                  {editingId ? "Update Plan" : "Create Plan"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 h-full">
          <Card className="border-slate-200 h-full flex flex-col">
            <CardHeader>
              <CardTitle>Boost Plan List</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <AgGridTable
                loading={loading}
                ref={gridRef}
                columns={columns}
                rowData={rows}
                onSelectionChange={(sel: any[]) => setSelected(sel as RPlan[])}
                tableName="Rental Boost Plans"
                gridHeight={630}
                noRowsMessage="No Plan found"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
