"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, X, Edit } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
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
import PageLoader from "@/components/common/PageLoader";

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  image: z.any().refine(
    (val) => {
      // Allow if it's 'existing' (edit mode with no new file), or has a file, or has files array
      if (val === 'existing') return true;
      if (val && val[0] instanceof File) return true;
      if (val instanceof File) return true;
      return false;
    },
    { message: "Image is required" }
  ),
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

// Compress image using Canvas API (skip for SVG and GIF)
const compressImage = (file: File, maxSizeKB = 1024, quality = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    // Skip compression for SVG and GIF - they don't benefit from canvas compression
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    // If file is already small enough, skip compression
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        // Downscale if very large (max 1920px wide)
        const MAX_DIM = 1920;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

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
  const [showBulkDeletePopup, setShowBulkDeletePopup] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<CategoryRow[]>([]);
  const gridRef = useRef<any>(null);
  const debouncedSearch = useDebounce(searchText, 600);

  // Fetch categories with search
  const fetchCategories = async (search?: string) => {
    setIsFetching(true);
    try {
      const params: any = {};

      if (search) params.search = search;

      const res = await api.get(endPointApi.getCategoryList, { params });

      // When setting categories from API response
      if (res?.data?.success && res?.data?.data) {
        // Transform data to include id field
        const transformedData = res.data.data.map((category: any) => ({
          ...category,
          id: category.categories_id || category._id // Add id field for AG Grid
        }));
        setCategories(transformedData);
      } else if (res?.data?.data) {
        setCategories(res.data.data);
      }
    } catch (error) {
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
    if (debouncedSearch.length >= 3 || debouncedSearch.length === 0) {
      fetchCategories(debouncedSearch);
    }
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
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: any) => {
        const imageUrl = getImageUrl(params.data.image);
        return (
          <div className="flex items-center gap-2 h-full py-1">
            <div className="h-7 w-7 shrink-0 rounded-md overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-110">
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
            <span className="font-semibold text-slate-900 text-sm">{params.value}</span>
          </div>
        );
      }
    },

    {
      field: "created_at",
      headerName: "Created",
      minWidth: 150,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A',
      cellStyle: { textAlign: "center" }
    },
    {
       field: "updated_at",
      headerName: "Updated",
      minWidth: 150,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A',
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Action",
      width: 90,
      minWidth: 90,
      maxWidth: 90,
      pinned: "right",
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
      cellRenderer: (params: any) => (
        <ActionButtons onEdit={() => handleEdit(params.data)} onDelete={() => handleDeleteClick(params.data)} />
      )
    }
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const watchImage = watch('image');

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files (too large or wrong type)
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors?.[0];
        if (err?.code === 'file-too-large') {
          toast.error('File is too large. Maximum size is 10MB.');
        } else if (err?.code === 'file-invalid-type') {
          toast.error('Invalid file type. Please upload SVG, PNG, JPG, JPEG, or WEBP.');
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        const rawFile = acceptedFiles[0];
        // Compress if image > 1MB (skip SVG/GIF)
        const file = await compressImage(rawFile, 1024, 0.85);
        const compressedFiles = [file];
        setValue('image', compressedFiles, { shouldValidate: true });
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
      }
    },
    [setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit
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

      if (data.image && data.image[0] instanceof File) {
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
        reset({
          name: "",
          image: undefined
        });
        setPreviewImage(null);
        await fetchCategories(debouncedSearch);
      }
    } catch (error: any) {
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
    clearErrors();
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

      // Check if the deleted category is the one being edited
      if (editingId === id) {
        setEditingId(null);
        setPreviewImage(null);
        reset({
          name: "",
          image: undefined
        }); // Clear the form
      }

      await fetchCategories(debouncedSearch);

      // Close popup
      setShowDeletePopup(false);
      setCategoryToDelete(null);
    } catch (error: any) {
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

  const handleConfirmBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    try {
      setIsBulkDeleting(true);
      const ids = selectedRows.map(r => r._id || r.id).filter(Boolean);

      const res = await api.delete(endPointApi.bulkDeleteCategory, {
        data: { ids }
      });

      if (res?.data?.message || res?.data?.success) {
        toast.success(`${selectedRows.length} categor${selectedRows.length > 1 ? 'ies' : 'y'} deleted successfully`);
        setSelectedRows([]);
        gridRef.current?.api?.deselectAll();
        await fetchCategories();
      } else {
        toast.error(res?.data?.message || 'Bulk delete failed');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete selected categories');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeletePopup(false);
    }
  };

  const handleCancelBulkDelete = () => {
    setShowBulkDeletePopup(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPreviewImage(null);
    reset({
      name: "",
      image: undefined
    });
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  const currentEditingCategory = editingId
    ? categories.find(c => c._id === editingId || c.categories_id === editingId)
    : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
        <>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Categories</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 items-stretch">
            {/* Left: Form */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-slate-100 shadow-sm h-full flex flex-col">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base">
                    {editingId ? 'Edit Category' : 'Add New Category'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="name" className="text-xs font-semibold text-slate-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        placeholder="e.g. Electronics"
                        className="h-9 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-lg text-sm"
                        {...register("name")}
                        error={errors.name?.message}
                      />
                    </div>

                    {/* Image Upload Field */}
                    <div className="space-y-1">
                      <label htmlFor="image" className="text-xs font-semibold text-slate-700">
                        Category Image <span className="text-red-500">*</span>
                      </label>

                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dotted rounded-lg relative overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer transition-all w-full min-h-[120px]",
                          isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
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
                                  className="bg-white/90 p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium text-slate-900 shadow-sm hover:bg-white"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                  View
                                </button>
                                <div className="bg-white/90 p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium text-slate-900 shadow-sm">
                                  <Edit size={12} />
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
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-20"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="bg-slate-100 p-1.5 rounded-full mb-1">
                              <Plus className="h-4 w-4 text-slate-500" />
                            </div>
                            {isDragActive ? (
                              <p className="text-xs font-medium text-primary">Drop the image here...</p>
                            ) : (
                              <div className="space-y-0.5">
                                <p className="text-xs font-medium text-slate-700">
                                  Click or drag image to upload
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  SVG, PNG, JPG, JPEG or WEBP (max. 10MB)
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {errors.image && (
                        <p className="text-xs text-red-500 mt-0.5">{errors.image.message as string}</p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {editingId
                          ? 'Upload a new image to replace the existing one'
                          : 'Upload an image for the category (JPEG, PNG, etc.)'}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        className="flex-1 h-9 rounded-lg btn-primary text-sm"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="flex items-center justify-center w-3 h-3">
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            </div>
                            {editingId ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3 w-3" />
                            {editingId ? 'Update' : 'Add'}
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-9 rounded-lg text-sm"
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
              <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-2 px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* LEFT */}
                    <div>
                      <CardTitle className="text-base">Category List</CardTitle>
                      <p className="text-xs text-slate-500">
                        Total: {categories.length} categories
                        {searchText && ` • Searching: "${searchText}"`}
                      </p>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {/* DELETE BUTTON */}
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedRows.length === 0}
                        onClick={() => {
                          if (selectedRows.length === 0) return;
                          setShowBulkDeletePopup(true);
                        }}
                        className="w-full sm:w-auto h-9 text-sm"
                      >
                        Delete Selected ({selectedRows.length})
                      </Button>

                      {/* SEARCH INPUT */}
                      <div className="relative w-full sm:w-56">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="pl-8 pr-7 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                        />

                        <MdSearch
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />

                        {searchText && (
                          <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-[45%] -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative">
                 
                    <AgGridTable
                      loading={isFetching}
                      ref={gridRef}
                      rowData={categories}
                      columns={columnDefs as ColDef[]}
                      onSelectionChange={(selected) => {
                        setSelectedRows(selected);
                      }}
                      enableSearch={false}
                      enableFilter={false}
                      gridHeight={600}
                      noRowsMessage="No category found"
                    />
                 
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

          <CommonDeleteModal
            open={showBulkDeletePopup}
            title="Delete Selected Categories?"
            description={`Are you sure you want to delete ${selectedRows.length} selected categories? This action cannot be undone.`}
            isLoading={isBulkDeleting}
            onCancel={handleCancelBulkDelete}
            onConfirm={handleConfirmBulkDelete}
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
                  className="absolute -top-8 right-0 text-white hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
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
        </>
    </div>
  );
}
