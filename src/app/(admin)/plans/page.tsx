"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/ui/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Trash, Edit, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

type Plan = {
  _id?: string;
  plan_type: string;
  months: number;
  max_products: number;
  amount: number;
  status?: string;
  description?: string;
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
  });
  const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" }
];

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
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 120,
      valueFormatter: (p) => `₹${p.value}`,
    },
    { field: "status", headerName: "Status", minWidth: 120 },
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
              className="w-8 h-8 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              onClick={() => startEdit(row)}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => deleteOne(row)}
            >
              <Trash size={16} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* TITLE */}

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Plan Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage subscription plans and pricing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT FORM */}

        <div className="lg:col-span-1">

          <Card className="sticky top-16 border-slate-200">

            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Plan" : "Add Plan"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              {/* Plan Type */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Plan Type
                </label>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={form.plan_type}
                  onChange={(e) =>
                    setForm({ ...form, plan_type: e.target.value })
                  }
                />
              </div>

              {/* Inputs */}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Months
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={form.months}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        months: Number(e.target.value || 1),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Max Products
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={form.max_products}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_products: Number(e.target.value || 1),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: Number(e.target.value || 0),
                      })
                    }
                  />
                </div>
              </div>

              {/* Status */}

      <div>
  <label className="text-sm font-semibold text-slate-700">
    Status
  </label>

  <div className="mt-1">
    <SearchableDropdown
      options={statusOptions}
      value={form.status}
      placeholder="Select Status"
      onChange={(val) =>
        setForm({ ...form, status: val as string })
      }
    />
  </div>
</div>

              {/* Description */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* Buttons */}

              <div className="flex gap-3">
                <Button onClick={savePlan} className="flex-1 btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update Plan" : "Create Plan"}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}

        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Plan List</CardTitle>
              <Button
              size="sm"
                variant="destructive"
                disabled={!selected.length || loading}
                onClick={deleteSelected}
                
              >
                {loading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                Delete Selected ({selected.length})
              </Button>

            </CardHeader>

            <CardContent className="p-0">

              <AgGridTable
                columns={columns}
                rowData={rows}
                onSelectionChange={(sel: any[]) =>
                  setSelected(sel as Plan[])
                }
                enableFilter={false}
                enableSearch={false}
                tableName="Plans"
              />

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}