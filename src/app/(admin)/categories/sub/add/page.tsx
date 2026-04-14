"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, X, Edit } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import AgGridTable from "@/components/ui/AgGridTable";
import { ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import PageLoader from "@/components/common/PageLoader";

const subCategorySchema = z.object({
  categoryId: z.string().min(1, "Please select a parent category"),
  name: z.string().min(2, "Sub-category name is required"),
  image: z.any().refine((files) => files && files.length > 0, "Image is required"),
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
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SubCategoryRow {
  id: string;
  name: string;
  parent: string;
  parentId: string;
  image: string;
  status: string;
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

export default function AddSubCategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryRow | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<SubCategoryRow[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  // Delete popup states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showBulkDeletePopup, setShowBulkDeletePopup] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const debouncedSearch = useDebounce(searchText, 600);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    control,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
    defaultValues: {
      categoryId: "",
      name: "",
    }
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

  // Image preview
  useEffect(() => {
    if (watchImage && watchImage[0] && watchImage[0] instanceof File) {
      const file = watchImage[0];
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (watchImage === 'existing') {
      return;
    } else {
      setPreviewImage(null);
    }
  }, [watchImage]);


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
                created_at: sub.created_at || sub.createdAt || new Date().toISOString(),
                updated_at: sub.updated_at || sub.updatedAt || new Date().toISOString(),
              });
            });
          }
        });
        setSubCategories(allSubCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error('Failed to fetch categories');
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
      formData.append("id", data.categoryId);
      formData.append("name", data.name);

      // Add image if selected
      if (data.image && data.image[0] instanceof File) {
        formData.append("image", data.image[0]);
      }

      const res = await api.post(endPointApi.createSubCategory, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data) {
        toast.success('Sub-category created successfully');

        // Refresh the list
        fetchCategories();
        reset({
          categoryId: "",
          name: "",
          image: undefined
        });
        setPreviewImage(null);
      }
    } catch (error: any) {
      console.error("Error creating subcategory:", error);
      toast.error(error.response?.data?.message || 'Failed to create sub-category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subCategory: SubCategoryRow) => {
    setEditingSubCategory(subCategory);
    setValue("categoryId", subCategory.parentId);
    setValue("name", subCategory.name);
    setValue("image", "existing");
    clearErrors();
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
      if (data.image && data.image[0] instanceof File) {
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
        toast.success('Sub-category updated successfully');

        // Refresh the list
        fetchCategories();
        setEditingSubCategory(null);
        reset({
          categoryId: "",
          name: "",
          image: undefined
        });
        setPreviewImage(null);
      }
    } catch (error: any) {
      console.error("Error updating subcategory:", error);
      toast.error(error.response?.data?.message || 'Failed to update sub-category');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete click handler - opens popup
  const handleDeleteClick = (subCategory: SubCategoryRow) => {
    setSubCategoryToDelete(subCategory);
    setShowDeletePopup(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!subCategoryToDelete) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`${endPointApi.deleteSubCategory}/${subCategoryToDelete.id}`);

      if (res.data) {
        // Check if the deleted sub-category is the one being edited
        if (editingSubCategory?.id === subCategoryToDelete.id) {
          setEditingSubCategory(null);
          setPreviewImage(null);
          reset({
            categoryId: "",
            name: "",
            image: undefined
          }); // Clear the form
        }

        toast.success('Sub-category deleted successfully');
        fetchCategories();
        setShowDeletePopup(false);
        setSubCategoryToDelete(null);
      }
    } catch (error: any) {
      console.error("Error deleting subcategory:", error);
      toast.error(error.response?.data?.message || 'Failed to delete sub-category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    try {
      setIsBulkDeleting(true);
      const ids = selectedRows.map(r => r.id).filter(Boolean);

      const res = await api.delete(endPointApi.bulkDeleteSubCategory, {
        data: { ids }
      });

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
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeletePopup(false);
    }
  };

  const handleCancelBulkDelete = () => {
    setShowBulkDeletePopup(false);
  };

  // Cancel delete handler
  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setSubCategoryToDelete(null);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Filter subcategories based on search
  const filteredSubCategories = (searchText.length >= 3 || searchText.length === 0)
    ? subCategories.filter(sub =>
      sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.parent.toLowerCase().includes(searchText.toLowerCase())
    )
    : subCategories;

  const columnDefs: ColDef<SubCategoryRow>[] = [
    {
      field: "name",
      headerName: "Sub Category",
      minWidth: 400,
      cellClass: "ag-cell-with-border",
      cellRenderer: (params: { data: SubCategoryRow }) => {
        const imageUrl = getImageUrl(params.data.image);

        return (
          <div className="flex items-center gap-2 h-full py-1">
            <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-110 bg-slate-100">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={params.data.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('placeholder-image.jpg')) {
                      target.src = "/placeholder-image.jpg";
                    }
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400">No img</span>
              )}
            </div>
            <span className="font-semibold text-slate-900 text-sm">{params.data.name}</span>
          </div>
        );
      }
    },
    {
      field: "parent",
      headerName: "Category",
      minWidth: 200,
      cellClass: "ag-cell-with-border",
      cellRenderer: (params: { data: SubCategoryRow }) => (
        <div className="flex items-center h-full">
          <span className="text-sm text-slate-600">{params.data.parent}</span>
        </div>
      )
    },
    {
      field: "created_at",
      headerName: "Created",
      minWidth: 150,
      cellClass: "ag-cell-with-border",
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A',
      cellStyle: { textAlign: "center" }
    },
    {
      field: "updated_at",
      headerName: "Updated",
      minWidth: 150,
      cellClass: "ag-cell-with-border", 

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
      cellRenderer: (params: { data: SubCategoryRow }) => (
        <ActionButtons onEdit={() => handleEdit(params.data)} onDelete={() => handleDeleteClick(params.data)} />
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
    reset({
      categoryId: "",
      name: "",
      image: undefined
    });
  };

  const currentEditingCategory = editingSubCategory
    ? categories.find(c => c.categories_id === editingSubCategory.parentId)
    : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sub Categories</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 items-stretch">
            {/* Left: Form */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-slate-100 shadow-sm h-full flex flex-col">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {editingSubCategory ? "Edit Sub Category" : "Add Sub Category"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="categoryId" className="text-xs font-semibold text-slate-700">
                        Parent Category <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="categoryId"
                        control={control}
                        render={({ field }) => (
                          <SearchableDropdown
                            options={categories.map((cat) => ({
                              value: String(cat.categories_id || ''),
                              label: cat.categories_name,
                              image: cat.image,
                            }))}
                            value={watch('categoryId') || ''}
                            onChange={(val) => {
                              const v = Array.isArray(val) ? val[0] : val;
                              setValue('categoryId', v, { shouldValidate: true, shouldDirty: true });
                            }}
                            disabled={isFetching}
                            error={!!errors.categoryId}
                            searchable
                            multiple={false}
                          />
                        )}
                      />
                      {errors.categoryId && (
                        <p className="text-xs text-red-500 mt-0.5">{errors.categoryId.message}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="name" className="text-xs font-semibold text-slate-700">
                        Sub Category Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        placeholder="e.g. Laptops"
                        className="h-9 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-lg text-sm"
                        {...register("name")}
                        error={errors.name?.message}
                      />
                    </div>

                    {/* Image Upload Field */}
                    <div className="space-y-1">
                      <label htmlFor="image" className="text-xs font-semibold text-slate-700">
                        Sub Category Image <span className="text-red-500">*</span>
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
                        {(previewImage || (editingSubCategory && editingSubCategory.image)) ? (
                          <div className="absolute inset-0 w-full h-full group">
                            <img
                              src={previewImage || getImageUrl(editingSubCategory?.image || "")}
                              alt="Sub-category"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-image.jpg";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = previewImage || getImageUrl(editingSubCategory?.image || "");
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
                                  SVG, PNG, JPG or GIF (max. 5MB)
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
                        {editingSubCategory
                          ? 'Upload a new image to replace the existing one'
                          : 'Upload an image for the sub-category'}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        className="flex-1 h-9 rounded-lg shadow-lg shadow-primary/20 btn-primary text-sm"
                        disabled={isLoading || isFetching}
                      >
                        {isLoading ? (
                          <>
                            <div className="flex items-center justify-center w-3 h-3">
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            </div>
                            {editingSubCategory ? "Updating..." : "Saving..."}
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3 w-3" />
                            {editingSubCategory ? "Update" : "Add"}
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
                      <CardTitle className="text-base">Sub-category Directory</CardTitle>
                      <p className="text-xs text-slate-500">
                        Total: {filteredSubCategories.length} sub-categories
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

                      {/* SEARCH */}
                      <div className="relative w-full sm:w-56">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="pl-8 pr-7 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 w-full text-sm"
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
                  {/* {filteredSubCategories.length === 0 && !isFetching ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="text-center">
                    <p className="text-slate-500 text-sm mb-2">
                      {searchText
                        ? `No sub-categories found matching "${searchText}"`
                        : 'No sub-categories found'}
                    </p>
                    {searchText && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearSearch}
                        className="text-xs h-8"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                </div>
              ) : ( */}
                  <AgGridTable
                    loading={isFetching}
                    rowData={filteredSubCategories}
                    columns={columnDefs as any}
                    onSelectionChange={(selected) => {
                      setSelectedRows(selected);
                    }}
                    enableSearch={false}
                    enableFilter={false}
                    gridHeight={600}
                  />
                  {/* )} */}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Delete Confirmation Popup */}
          <CommonDeleteModal
            open={showDeletePopup}
            title="Delete Sub Category?"
            description={subCategoryToDelete ? `Are you sure you want to delete "${subCategoryToDelete.name}"? This action cannot be undone.` : "This action cannot be undone."}
            isLoading={isDeleting}
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />

          <CommonDeleteModal
            open={showBulkDeletePopup}
            title="Delete Selected Sub-categories?"
            description={`Are you sure you want to delete ${selectedRows.length} selected sub-categories? This action cannot be undone.`}
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
                  className="absolute -top-8 right-0 text-white hover:text-gray-300 transition-colors text-sm"
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
    </div>
  );
}
