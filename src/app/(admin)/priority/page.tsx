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
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import { Checkbox } from "@/components/ui/Checkbox";


type PPlan = {
  _id?: string;
  name: string;
  monthly_price: number | '';
  yearly_price: number | '';
  product_slots: number | '';
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
  const gridRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<string>("");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Options for dropdowns
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

  useEffect(() => { fetchData(); }, []);

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <PageLoader fullScreen={false} />
      </div>
    );
  }

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
    const newErrors: { [k: string]: string } = {};
    if (!String(form.name || '').trim()) newErrors.name = 'Plan name is required';
    if (form.monthly_price === '' || Number(form.monthly_price) < 0) newErrors.monthly_price = 'Monthly price must be 0 or more';
    if (form.yearly_price === '' || Number(form.yearly_price) < 0) newErrors.yearly_price = 'Yearly price must be 0 or more';
    if (form.product_slots === '' || Number(form.product_slots) < 1) newErrors.product_slots = 'Slots must be at least 1';
    if (!String(form.description || '').trim()) newErrors.description = 'Description is required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});
    try {
      const payload = { ...form, name: String(form.name).trim() };
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
    setSelectedPlanType(p.name.toLowerCase());
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOne = (plan: PPlan) => {
    const id = plan._id || (plan as any).id;
    if (!id) { toast.error("Invalid plan id"); return; }
    setDeleteId(id);
    setIsBulkDelete(false);
    setOpenDeleteModal(true);
  };

  const deleteSelected = () => {
    if (!selected.length) { toast.info("Select rows to delete"); return; }
    setIsBulkDelete(true);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (isBulkDelete) {
        for (const r of selected) {
          const id = (r as any)._id || (r as any).id;
          if (id) await api.delete(`${endPointApi.deletePriorityPlan}/${id}`);
        }
        toast.success("Selected plans deleted");
        setSelected([]);
        gridRef.current?.api?.deselectAll();
      } else if (deleteId) {
        await api.delete(`${endPointApi.deletePriorityPlan}/${deleteId}`);
        toast.success("Deleted successfully");
      }
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (isBulkDelete ? "Bulk delete failed" : "Delete failed"));
    } finally {
      setIsDeleting(false);
      setOpenDeleteModal(false);
      setDeleteId(null);
    }
  };

  // Custom cell renderer for Popular column with checkbox
  const PopularCellRenderer = (params: any) => {
    const isPopular = params.value;
    return (
      <div className="flex items-center justify-center h-full">
        <Checkbox
          checked={isPopular}
          disabled={true}
          className="text-yellow-500"
        />
        {errors.product_slots ? (<p className="mt-1 text-xs text-red-600">{errors.product_slots}</p>) : null}
        {errors.yearly_price ? (<p className="mt-1 text-xs text-red-600">{errors.yearly_price}</p>) : null}
        {errors.monthly_price ? (<p className="mt-1 text-xs text-red-600">{errors.monthly_price}</p>) : null}
      </div>
    );
  };

  const columns: ColDef[] = [
    { field: "name", headerName: "Name", minWidth: 160 },
    { field: "monthly_price", headerName: "Monthly", minWidth: 100, valueFormatter: (p) => `₹${p.value}` },
    { field: "yearly_price", headerName: "Yearly", minWidth: 100, valueFormatter: (p) => `₹${p.value}` },
    { field: "product_slots", headerName: "Slots", minWidth: 100 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />,
    },
    { field: "addon_available_for_yearly", headerName: "Annual Add-on", minWidth : 100, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
    { field: "addon_price_per_year", headerName: "Add-on Price", minWidth: 100, valueFormatter: (p) => p.value ? `₹${p.value}` : '-' },
    { field: "addon_max_slots", headerName: "Add-on Slots", minWidth: 100 },
    {
      field: "is_popular",
      headerName: "Popular",
      minWidth: 80,
      cellRenderer: PopularCellRenderer,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
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
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Priority Plans (Visibility & Placement)</h2>
        {/* <Button variant="destructive" size="sm" disabled={!selected.length || loading} onClick={deleteSelected}>
          {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
          Delete Selected ({selected.length})
        </Button> */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-stretch" style={{ height: '770px' }}>
        <div className="lg:col-span-1 h-full">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 h-full flex flex-col">
            <div className="space-y-3">
              {/* Plan Type Dropdown */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Plan Type</label>
                <div className="mt-1">
                  <div className={`rounded-lg ${errors.name ? 'ring-1 ring-red-500' : ''}`}>
                    <SearchableDropdown
                      searchable
                      options={planTypeOptions}
                      value={selectedPlanType}
                      placeholder="Select Plan Type"
                      onChange={(value) => {
                        const val = value as string;
                        setSelectedPlanType(val);
                        setForm({ ...form, name: val.charAt(0).toUpperCase() + val.slice(1) });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        if (val === "premium") {
                          setForm(prev => ({ ...prev, addon_available_for_yearly: true }));
                        } else {
                          setForm(prev => ({ ...prev, addon_available_for_yearly: false, addon_price_per_year: 0, addon_max_slots: 0 }));
                        }
                      }}
                    />
                  </div>
                  {errors.name ? (<p className="mt-1 text-xs text-red-600">{errors.name}</p>) : null}
                </div>
              </div>

              {/* Price and Slots Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Monthly Price Field */}
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Monthly Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.monthly_price ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                    aria-invalid={!!errors.monthly_price}
                    value={form.monthly_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string temporarily for better UX
                      if (value === '') {
                        setForm({ ...form, monthly_price: '' });
                        return;
                      }
                      const numValue = Number(value);
                      // Restrict to max 6 digits (0-999999)
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 999999) {
                        setForm({ ...form, monthly_price: numValue });
                        if (errors.monthly_price) setErrors(prev => ({ ...prev, monthly_price: '' }));
                      }
                    }}
                    onBlur={(e) => {
                      // Set default value if empty on blur
                      if (e.target.value === '') {
                        setForm({ ...form, monthly_price: 0 });
                      }
                    }}
                  />
                  {errors.monthly_price ? (<p className="mt-1 text-xs text-red-600">{errors.monthly_price}</p>) : null}
                </div>

                {/* Yearly Price Field */}
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Yearly Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.yearly_price ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                    aria-invalid={!!errors.yearly_price}
                    value={form.yearly_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string temporarily for better UX
                      if (value === '') {
                        setForm({ ...form, yearly_price: '' });
                        return;
                      }
                      const numValue = Number(value);
                      // Restrict to max 6 digits (0-999999)
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 999999) {
                        setForm({ ...form, yearly_price: numValue });
                        if (errors.yearly_price) setErrors(prev => ({ ...prev, yearly_price: '' }));
                      }
                    }}
                    onBlur={(e) => {
                      // Set default value if empty on blur
                      if (e.target.value === '') {
                        setForm({ ...form, yearly_price: 0 });
                      }
                    }}
                  />
                  {errors.yearly_price ? (<p className="mt-1 text-xs text-red-600">{errors.yearly_price}</p>) : null}
                </div>

                {/* Product Slots Field */}
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Product Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999999"
                    step="1"
                    className={`mt-1 w-full rounded-lg px-3 py-2 border ${errors.product_slots ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                    aria-invalid={!!errors.product_slots}
                    value={form.product_slots}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string temporarily for better UX
                      if (value === '') {
                        setForm({ ...form, product_slots: '' });
                        return;
                      }
                      const numValue = Number(value);
                      // Restrict to max 6 digits (1-999999)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 999999) {
                        setForm({ ...form, product_slots: numValue });
                        if (errors.product_slots) setErrors(prev => ({ ...prev, product_slots: '' }));
                      }
                    }}
                    onBlur={(e) => {
                      // Set default value if empty on blur
                      if (e.target.value === '') {
                        setForm({ ...form, product_slots: 1 });
                      }
                    }}
                  />
                  {errors.product_slots ? (<p className="mt-1 text-xs text-red-600">{errors.product_slots}</p>) : null}
                </div>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <div className="mt-1">
                  <SearchableDropdown
                    options={statusOptions}
                    value={form.status || ''}
                    placeholder="Select Status"
                    onChange={(value) => setForm({ ...form, status: value as string })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  className={`mt-1 w-full rounded-lg px-3 py-2 text-sm border ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                  aria-invalid={!!errors.description}
                  rows={3}
                  value={form.description}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, description: v });
                    if (errors.description && v.trim()) setErrors(prev => ({ ...prev, description: '' }));
                  }}
                />
                {errors.description ? (<p className="mt-1 text-xs text-red-600">{errors.description}</p>) : null}
              </div>

              {/* Add-on Section for Premium */}
              {selectedPlanType === "premium" && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="col-span-1">
                    <label className="text-sm font-semibold text-slate-700">Annual Add-on</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Checkbox
                        checked={!!form.addon_available_for_yearly}
                        onCheckedChange={(checked) => setForm({ ...form, addon_available_for_yearly: checked })}
                      />
                      <span className="text-sm text-slate-600">Available</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Add-on Price/Year</label>
                    <input
                      type="number"
                      className={`mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!form.addon_available_for_yearly ? 'bg-slate-100' : ''
                        }`}
                      value={form.addon_price_per_year}
                      onChange={(e) => setForm({ ...form, addon_price_per_year: Number(e.target.value || 0) })}
                      disabled={!form.addon_available_for_yearly}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Add-on Max Slots</label>
                    <input
                      type="number"
                      className={`mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!form.addon_available_for_yearly ? 'bg-slate-100' : ''
                        }`}
                      value={form.addon_max_slots}
                      onChange={(e) => setForm({ ...form, addon_max_slots: Number(e.target.value || 0) })}
                      disabled={!form.addon_available_for_yearly}
                    />
                  </div>
                </div>
              )}

              {/* Popular Checkbox */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Mark as Popular</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Checkbox
                    checked={!!form.is_popular}
                    onCheckedChange={(checked) => setForm({ ...form, is_popular: checked })}
                    className="border-yellow-300 text-yellow-500"
                  />
                  <span className="text-sm text-slate-700">⭐ Show as popular plan (only one can be popular)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button onClick={savePlan} className="flex-1 btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update Priority Plan" : "Create Priority Plan"}
                </Button>
                <Button variant="outline" className="flex-1 border-slate-300" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="lg:col-span-2 h-full">
          <Card className="border-slate-200">
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
              {/* <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-2"> */}
              <AgGridTable
                ref={gridRef}
                columns={columns}
                rowData={rows}
                onSelectionChange={(sel: any[]) => setSelected(sel as PPlan[])}
                enableFilter={false}
                enableSearch={false}
                tableName="Priority Plans"
                gridHeight={700}
              />
              {/* </div> */}
            </CardContent>
          </Card>
        </div>
      </div>

      <CommonDeleteModal
        open={openDeleteModal}
        isLoading={isDeleting}
        onCancel={() => {
          setOpenDeleteModal(false);
          setDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
        title={isBulkDelete ? "Delete Selected Plans?" : "Delete Priority Plan?"}
        description={isBulkDelete 
          ? `Are you sure you want to delete ${selected.length} selected priority plans? This action cannot be undone.`
          : "Are you sure you want to delete this priority plan? This action cannot be undone."
        }
      />
    </div>
  );
}
