"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Search, Edit, Trash, Layers } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ColDef } from "ag-grid-community";

const subCategorySchema = z.object({
  categoryId: z.string().min(1, "Please select a parent category"),
  name: z.string().min(2, "Sub-category name must be at least 2 characters"),
});

type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

const mockCategories = [
  { id: "1", name: "Electronics" },
  { id: "2", name: "Fashion" },
  { id: "3", name: "Home & Garden" },
];

const initialSubCategories = [
  { id: 1, name: "Smartphones", parent: "Electronics", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop", count: 45, status: "Active" },
  { id: 2, name: "Laptops", parent: "Electronics", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop", count: 32, status: "Active" },
  { id: 3, name: "Casual Wear", parent: "Fashion", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop", count: 28, status: "Active" },
  { id: 4, name: "Indoor Plants", parent: "Home & Garden", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100&h=100&fit=crop", count: 15, status: "Inactive" },
];

interface SubCategoryRow {
  id: number;
  name: string;
  parent: string;
  image: string;
  count: number;
  status: string;
}

export default function AddSubCategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [subCategories, setSubCategories] = useState(initialSubCategories);

  const columnDefs: ColDef<SubCategoryRow>[] = [
    { 
      field: "name", 
      headerName: "Name", 
      flex: 1,
      cellStyle: { fontWeight: "600", color: "#1e293b", display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "parent", 
      headerName: "Main Category", 
      flex: 1,
      cellStyle: { color: "#64748b", display: 'flex', alignItems: 'center' }
    },
    { 
      field: "image", 
      headerName: "Image", 
      width: 100,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full">
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-110">
            <img src={params.value} alt="Sub Category" className="h-full w-full object-cover" />
          </div>
        </div>
      )
    },
    {
      headerName: "Action",
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: () => (
        <div className="flex items-center justify-start gap-2 h-full">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash size={16} />
          </Button>
        </div>
      )
    }
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
  });

  const onSubmit = async (data: SubCategoryFormValues) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const parent = mockCategories.find(c => c.id === data.categoryId)?.name || "Unknown";
    const newSub = {
      id: subCategories.length + 1,
      name: data.name,
      parent: parent,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
      count: 0,
      status: "Active"
    };
    setSubCategories([newSub, ...subCategories]);
    setIsLoading(false);
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sub Categories</h2>
        <p className="text-muted-foreground mt-1 text-slate-500">Manage deeper levels of your product hierarchy.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Add Sub Category</CardTitle>
              </div>
              <CardDescription>
                Link a new sub-category to a parent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="categoryId" className="text-sm font-semibold text-slate-700">Parent Category</label>
                  <select
                    id="categoryId"
                    className="flex h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    {...register("categoryId")}
                  >
                    <option value="">Select a category</option>
                    {mockCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">Sub Category Name</label>
                  <Input
                    id="name"
                    placeholder="e.g. Laptops"
                    className="h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sub Category
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Sub-category Directory</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search subs..." className="pl-9 h-9 w-48 bg-white border-slate-100 text-xs rounded-lg" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative h-[600px]">
              <DataTable
                rowData={subCategories}
                columnDefs={columnDefs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
