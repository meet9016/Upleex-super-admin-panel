"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Search, Edit, Trash } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ColDef } from "ag-grid-community";
import { DataTable } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const initialCategories = [
  { id: 1, name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop", count: 124, status: "Active" },
  { id: 2, name: "Fashion", image: "https://images.unsplash.com/photo-1445205170230-053b830c6050?w=100&h=100&fit=crop", count: 85, status: "Active" },
  { id: 3, name: "Home & Garden", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=100&h=100&fit=crop", count: 62, status: "Inactive" },
  { id: 4, name: "Books", image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=100&h=100&fit=crop", count: 45, status: "Active" },
];

interface CategoryRow {
  id: number;
  name: string;
  image: string;
  count: number;
  status: string;
}

export default function AddCategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);

  const columnDefs: ColDef<CategoryRow>[] = [
    { 
      field: "name", 
      headerName: "Category Name", 
      flex: 1,
      cellStyle: { fontWeight: "600", color: "#1e293b", display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "image", 
      headerName: "Image", 
      width: 100,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full">
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-110">
            <img src={params.value} alt="Category" className="h-full w-full object-cover" />
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: CategoryFormValues) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newCategory = {
      id: categories.length + 1,
      name: data.name,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
      description: data.description,
      count: 0,
      status: "Active"
    };
    setCategories([newCategory, ...categories]);
    setIsLoading(false);
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Categories</h2>
        <p className="text-muted-foreground mt-1 text-slate-500">Manage your product categories and hierarchy.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Add New Category</CardTitle>
              <CardDescription>
                Create a top-level category for organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">Name</label>
                  <Input
                    id="name"
                    placeholder="e.g. Smartphones"
                    className="bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    id="description"
                    className="flex min-h-[100px] w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    placeholder="Briefly describe what goes here..."
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Category List</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search..." className="pl-9 h-9 w-48 bg-white border-slate-100 text-xs rounded-lg" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <DataTable
                rowData={categories}
                columnDefs={columnDefs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
