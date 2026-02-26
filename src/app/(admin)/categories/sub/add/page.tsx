"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Search, Edit, Trash, Layers } from "lucide-react";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ColDef } from "ag-grid-community";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

const subCategorySchema = z.object({
  categoryId: z.string().min(1, "Please select a parent category"),
  name: z.string().min(2, "Sub-category name must be at least 2 characters"),
  image: z.any().optional(),
});

type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

interface Category {
  categories_id: string;
  categories_name: string;
  image: string;
  product_count: string;
  subcategories: SubCategory[];
}

interface SubCategory {
  subcategory_id: string;
  subcategory_name: string;
  image: string;
  parent_category?: string;
}

interface SubCategoryRow {
  id: string;
  name: string;
  parent: string;
  parentId: string;
  image: string;
  status: string;
  created_at?: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AddSubCategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryRow | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const debouncedSearch = useDebounce(searchText, 600);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
  });

  const watchImage = watch('image');

  // Image preview
  useEffect(() => {
    if (watchImage && watchImage[0]) {
      const file = watchImage[0];
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewImage(null);
    }
  }, [watchImage]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Search effect
  useEffect(() => {
    if (debouncedSearch) {
      // If you have a backend API that supports searching subcategories
      // fetchSearchedSubCategories(debouncedSearch);
    } else {
      fetchCategories();
    }
  }, [debouncedSearch]);

  const fetchCategories = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(endPointApi.getCategoryList);
      
      if (res.data?.data) {
        setCategories(res.data.data);
        
        // Extract all subcategories from categories
        const allSubCategories: SubCategoryRow[] = [];
        res.data.data.forEach((category: Category) => {
          if (category.subcategories && category.subcategories.length > 0) {
            category.subcategories.forEach((sub: SubCategory) => {
              allSubCategories.push({
                id: sub.subcategory_id,
                name: sub.subcategory_name,
                parent: category.categories_name,
                parentId: category.categories_id,
                image: sub.image || "",
                status: "Active",
                created_at: new Date().toISOString(), // You might have this from API
              });
            });
          }
        });
        setSubCategories(allSubCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setNotification({
        type: 'error',
        message: 'Failed to fetch categories'
      });
    } finally {
      setIsFetching(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/placeholder-image.jpg";
    
    if (imagePath.startsWith('http')) return imagePath;
    
    if (imagePath.startsWith('/uploads')) {
      return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
    }
    
    return "/placeholder-image.jpg";
  };

  const onSubmit = async (data: SubCategoryFormValues) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("categoryId", data.categoryId);
      formData.append("name", data.name);
      
      // Add image if selected
      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      const res = await api.post(endPointApi.createSubCategory, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data) {
        setNotification({
          type: 'success',
          message: 'Sub-category created successfully'
        });
        
        // Refresh the list
        fetchCategories();
        reset();
        setPreviewImage(null);
      }
    } catch (error: any) {
      console.error("Error creating subcategory:", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create sub-category'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subCategory: SubCategoryRow) => {
    setEditingSubCategory(subCategory);
    setValue("categoryId", subCategory.parentId);
    setValue("name", subCategory.name);
    setValue("image", "");
    setPreviewImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (data: SubCategoryFormValues) => {
    if (!editingSubCategory) return;

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("id", data.categoryId);
      formData.append("name", data.name);
      
      // Add image if selected
      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      const res = await api.put(
        `${endPointApi.updateSubCategory}/${editingSubCategory.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data) {
        setNotification({
          type: 'success',
          message: 'Sub-category updated successfully'
        });
        
        // Refresh the list
        fetchCategories();
        setEditingSubCategory(null);
        reset();
        setPreviewImage(null);
      }
    } catch (error: any) {
      console.error("Error updating subcategory:", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update sub-category'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) return;

    try {
      const res = await api.delete(`${endPointApi.deleteSubCategory}/${id}`);

      if (res.data) {
        setNotification({
          type: 'success',
          message: 'Sub-category deleted successfully'
        });
        
        // Refresh the list
        fetchCategories();
      }
    } catch (error: any) {
      console.error("Error deleting subcategory:", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete sub-category'
      });
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Filter subcategories based on search
  const filteredSubCategories = subCategories.filter(sub => 
    sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
    sub.parent.toLowerCase().includes(searchText.toLowerCase())
  );

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
      headerName: "Image",
      width: 100,
      cellRenderer: (params: { value: string }) => {
        const imageUrl = getImageUrl(params.value);

        return (
          <div className="flex items-center h-full">
            <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm">
              <img 
                src={imageUrl}
                alt="Sub Category" 
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('placeholder-image.jpg')) {
                    target.src = "/placeholder-image.jpg";
                  }
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 120,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A',
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Action",
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data: SubCategoryRow }) => (
        <div className="flex items-center justify-start gap-2 h-full">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={() => handleEdit(params.data)}
          >
            <Edit size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => handleDelete(params.data.id)}
          >
            <Trash size={16} />
          </Button>
        </div>
      )
    }
  ];

  const onSubmitForm = async (data: SubCategoryFormValues) => {
    if (editingSubCategory) {
      await handleUpdate(data);
    } else {
      await onSubmit(data);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubCategory(null);
    setPreviewImage(null);
    reset();
  };

  const currentEditingCategory = editingSubCategory 
    ? categories.find(c => c.categories_id === editingSubCategory.parentId)
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all transform animate-in slide-in-from-top-2 ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
                <CardTitle className="text-lg">
                  {editingSubCategory ? "Edit Sub Category" : "Add Sub Category"}
                </CardTitle>
              </div>
              <CardDescription>
                {editingSubCategory 
                  ? "Update the selected sub-category" 
                  : "Link a new sub-category to a parent."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="categoryId" className="text-sm font-semibold text-slate-700">
                    Parent Category
                  </label>
                  <select
                    id="categoryId"
                    className="flex h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    {...register("categoryId")}
                    disabled={isFetching}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.categories_id} value={cat.categories_id}>
                        {cat.categories_name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                    Sub Category Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g. Laptops"
                    className="h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                </div>

                {/* Image Upload Field */}
                <div className="space-y-2">
                  <label htmlFor="image" className="text-sm font-semibold text-slate-700">
                    Sub Category Image
                  </label>
                  
                  {/* Show current image when editing */}
                  {editingSubCategory && editingSubCategory.image && !previewImage && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-2">Current Image:</p>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src={getImageUrl(editingSubCategory.image)}
                          alt="Current sub-category"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-image.jpg";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Show preview of new image */}
                  {previewImage && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-2">New Image Preview:</p>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    {...register("image")}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {editingSubCategory 
                      ? 'Upload a new image to replace the existing one' 
                      : 'Upload an image for the sub-category (JPEG, PNG, etc.)'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20" 
                    disabled={isLoading || isFetching}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingSubCategory ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingSubCategory ? "Update Sub Category" : "Add Sub Category"}
                      </>
                    )}
                  </Button>
                  
                  {editingSubCategory && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Sub-category Directory</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {filteredSubCategories.length} sub-categories
                    {searchText && ` • Searching: "${searchText}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search sub-categories..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500dark:text-white w-64 text-sm"
                    />
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    {searchText && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              {isFetching ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {searchText ? 'Searching...' : 'Loading sub-categories...'}
                    </p>
                  </div>
                </div>
              ) : filteredSubCategories.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="text-center">
                    <p className="text-slate-500 mb-2">
                      {searchText
                        ? `No sub-categories found matching "${searchText}"`
                        : 'No sub-categories found'}
                    </p>
                    {searchText && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleClearSearch}
                        className="text-xs"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <DataTable
                  rowData={filteredSubCategories}
                  columnDefs={columnDefs}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}