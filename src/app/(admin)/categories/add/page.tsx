"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Edit, Trash, X } from "lucide-react";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ColDef } from "ag-grid-community";
import { DataTable } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import AgGridTable from "@/components/ui/AgGridTable";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
   image: z.any().refine((files) => files && files.length > 0, "Image is required"),

});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryRow {
  _id: string;
  id?: string;
  categories_name: string;
  categories_id?: string;
  image?: string;
  subcategories?: any[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AddCategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  // Delete popup states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
 const [selectedRows, setSelectedRows] = useState<CategoryRow[]>([]);
  const debouncedSearch = useDebounce(searchText, 600);

  // Fetch categories with search
  const fetchCategories = async (search?: string) => {
    setIsFetching(true);
    try {
      const params: any = {};

      if (search) params.search = search;

      console.log("🚀 ~ API Request Params:", params);

      const res = await api.get(endPointApi.getCategoryList, { params });
      console.log("🚀 ~ API Response:", res);

    // When setting categories from API response
if (res?.data?.success && res?.data?.data) {
  // Transform data to include id field
  const transformedData = res.data.data.map((category: any) => ({
    ...category,
    id: category.categories_id || category._id // Add id field for AG Grid
  }));
  setCategories(transformedData);
}else if (res?.data?.data) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Search effect
  useEffect(() => {
    fetchCategories(debouncedSearch);
  }, [debouncedSearch]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";

    if (imagePath.startsWith('http')) return imagePath;

    if (imagePath.startsWith('/uploads')) {
      return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
    }

    return imagePath;
  };

  const columnDefs: ColDef<CategoryRow>[] = [
    {
      field: "categories_name",
      headerName: "Category",
      width: 400,
      cellRenderer: (params: any) => {
        const imageUrl = getImageUrl(params.data.image);
        return (
          <div className="flex items-center gap-3 h-full py-2">
            <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-110">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={params.value}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('no-image')) {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f1f5f9'/%3E%3Ctext x='20' y='20' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3ENo img%3C/text%3E%3C/svg%3E";
                    }
                  }}
                />
              ) : (
                <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <rect width="40" height="40" fill="#f1f5f9" />
                    <text x="20" y="20" fontFamily="Arial" fontSize="10" fill="#94a3b8" textAnchor="middle" dominantBaseline="middle">
                      No img
                    </text>
                  </svg>
                </div>
              )}
            </div>
            <span className="font-semibold text-slate-900">{params.value}</span>
          </div>
        );
      }
    },
    // {
    //   field: "subcategories",
    //   headerName: "Sub Categories",
    //   width: 130,
    //   valueGetter: (params) => params.data?.subcategories?.length || 0,
    //   cellStyle: { textAlign: "center" }
    // },
    {
      field: "status",
      headerName: "Status",
      width: 190,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${params.value === 'Active'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
            }`}>
            {params.value || 'Active'}
          </span>
        </div>
      )
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 200,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A',
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Action",
      width: 200,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-start gap-2 h-full pl-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white transition"
            onClick={() => handleEdit(params.data)}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
            onClick={() => handleDeleteClick(params.data)}
          >
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const watchImage = watch('image');

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setValue('image', acceptedFiles, { shouldValidate: true });
        const file = acceptedFiles[0];
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
      }
    },
    [setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.svg', '.webp'],
    },
    maxFiles: 1,
  });

  useEffect(() => {
    if (watchImage && watchImage[0] && watchImage[0] instanceof File) {
      const file = watchImage[0];
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (watchImage === 'existing') {
      // Keep existing image, don't set preview
      return;
    } else {
      setPreviewImage(null);
    }
  }, [watchImage]);

  const onSubmit = async (data: CategoryFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("categories_name", data.name);

      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      let res;
      if (editingId) {
        res = await api.put(
          `${endPointApi.updateCategory}/${editingId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (res?.data) {
          toast.success('Category updated successfully');
          setEditingId(null);
        }
      } else {
        res = await api.post(
          endPointApi.postCategoryList,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (res?.data?.success || res?.data?.status === 200) {
          toast.success(res?.data?.message || 'Category created successfully');
        }
      }

      if (res?.data) {
        reset();
        setPreviewImage(null);
        await fetchCategories(debouncedSearch);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(
        error?.response?.data?.message ||
        (editingId ? 'Failed to update category' : 'Failed to create category')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: CategoryRow) => {
    const id = category._id || category.categories_id;
    setEditingId(String(id));
    setValue('name', category.categories_name || '');
    setValue('image', 'existing');
    setPreviewImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete click handler - opens popup
  const handleDeleteClick = (category: CategoryRow) => {
    setCategoryToDelete(category);
    setShowDeletePopup(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const id = categoryToDelete._id || categoryToDelete.categories_id;

      await api.delete(`${endPointApi.deleteCategory}/${id}`);
      toast.success("Category deleted successfully");
      await fetchCategories(debouncedSearch);

      // Close popup
      setShowDeletePopup(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error?.response?.data?.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete handler
  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setCategoryToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPreviewImage(null);
    reset();
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  const currentEditingCategory = editingId
    ? categories.find(c => c._id === editingId || c.categories_id === editingId)
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Categories</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-stretch" style={{ height: '770px' }}>
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g. Electronics"
                    className="bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                </div>

                {/* Image Upload Field */}
                <div className="space-y-2">
                  <label htmlFor="image" className="text-sm font-semibold text-slate-700">
                    Category Image
                  </label>

                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer transition-all w-full min-h-[160px]",
                      isDragActive ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      errors.image ? "border-red-500 bg-red-50" : ""
                    )}
                  >
                    <input {...getInputProps()} />

                    {/* Show Preview Image (New or Existing) */}
                    {(previewImage || (editingId && currentEditingCategory?.image)) ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img
                          src={previewImage || getImageUrl(currentEditingCategory?.image || "")}
                          alt="Category"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f1f5f9'/%3E%3Ctext x='48' y='48' font-family='Arial' font-size='12' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3ENo image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = previewImage || getImageUrl(currentEditingCategory?.image || "");
                                setModalImageUrl(url);
                                setImageModalOpen(true);
                              }}
                              className="bg-white/90 p-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                              View
                            </button>
                            <div className="bg-white/90 p-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-900 shadow-sm">
                              <Edit size={14} />
                              Change
                            </div>
                          </div>
                        </div>
                        {/* Remove Button for new uploads */}
                        {previewImage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(null);
                              setValue('image', undefined);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-20"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-100 p-2 rounded-full mb-2">
                          <Plus className="h-5 w-5 text-slate-500" />
                        </div>
                        {isDragActive ? (
                          <p className="text-sm font-medium text-primary">Drop the image here...</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-700">
                              Click or drag image to upload
                            </p>
                            <p className="text-xs text-slate-500">
                              SVG, PNG, JPG or GIF (max. 5MB)
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {errors.image && (
                    <p className="text-xs text-red-500 mt-1">{errors.image.message as string}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {editingId
                      ? 'Upload a new image to replace the existing one'
                      : 'Upload an image for the category (JPEG, PNG, etc.)'}
                  </p>
                </div>
              <div className="flex gap-3">
  <Button
    type="submit"
    className="flex-1 h-11 rounded-xl btn-primary"
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {editingId ? 'Updating...' : 'Adding...'}
      </>
    ) : (
      <>
        <Plus className="mr-2 h-4 w-4" />
        {editingId ? 'Update Category' : 'Add Category'}
      </>
    )}
  </Button>

  <Button
    type="button"
    variant="outline"
    className="flex-1 h-11"
    onClick={handleCancelEdit}
  >
    Cancel
  </Button>
</div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
         <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Category List
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {categories.length} categories
                    {searchText && ` • Searching: "${searchText}"`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedRows.length === 0}
                    onClick={async () => {
                      if (selectedRows.length === 0) return;
                      if (!confirm(`Delete ${selectedRows.length} selected sub-categories?`)) return;

                      try {
                        const ids = selectedRows.map(r => r.id).filter(Boolean);

                        // Option 1: Use POST for bulk delete (recommended)
                        const res = await api.delete(endPointApi.bulkDeleteCategory, {
                          data: { ids }
                        });

                        // Option 2: If you must use DELETE, send data in config
                        // const res = await api.delete(endPointApi.bulkDeleteSubCategory, { data: { ids } });

                        if (res?.data?.message || res?.data?.success) {
                          toast.success(`${selectedRows.length} sub-categor${selectedRows.length > 1 ? 'ies' : 'y'} deleted successfully`);
                          setSelectedRows([]);
                          await fetchCategories();
                        } else {
                          toast.error(res?.data?.message || 'Bulk delete failed');
                        }
                      } catch (error: any) {
                        console.error("Bulk delete error:", error);
                        toast.error(error?.response?.data?.message || 'Failed to delete selected sub-categories');
                      }
                    }}
                  >
                    Delete Selected ({selectedRows.length})
                  </Button>
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
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
                      {searchText ? 'Searching...' : 'Loading categories...'}
                    </p>
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="text-center">
                    <p className="text-slate-500 mb-2">
                      {searchText
                        ? `No categories found matching "${searchText}"`
                        : 'No categories found'}
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
                <AgGridTable
                  rowData={categories}
                  columns={columnDefs as ColDef[]}
                  onSelectionChange={(selected) => {
                    setSelectedRows(selected);
                  }}
                  enableSearch={false} // Since you have your own search
                  enableFilter={false}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
       <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Category?"
        description={categoryToDelete ? `Are you sure you want to delete "${categoryToDelete.categories_name}"? This action cannot be undone.` : "This action cannot be undone."}
        isLoading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

        {/* Image Modal */}
            {imageModalOpen && modalImageUrl && (
              <div 
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setImageModalOpen(false)}
              >
                <div className="relative max-w-4xl max-h-[90vh]">
                  <button
                    onClick={() => setImageModalOpen(false)}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                  >
                    <X size={32} />
                  </button>
                  <img
                    src={modalImageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
    </div>
  );
}