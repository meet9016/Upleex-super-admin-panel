"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, X, Edit, Layers } from "lucide-react";
import ActionButtons from "@/components/common/ActionButtons";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import AgGridTable from "@/components/ui/AgGridTable";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import PageLoader from "@/components/common/PageLoader";

const bannerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  subtitle: z.string().optional().default(""),
  description: z.string().optional().default(""),
  color: z.string().optional().default("bg-blue-900"),
  link: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  image: z.any().refine((files) => files && (files === "existing" || files.length > 0), "Image is required"),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerRow {
  id: string;
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  color?: string;
  link?: string;
  status: "active" | "inactive";
  createdAt: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function BannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<BannerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<BannerRow[]>([]);
  const gridRef = useRef<any>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

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
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      status: "active",
      color: "bg-blue-900",
    },
  });

  const watchImage = watch('image');

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Basic check for image proportions (optional, can be more strict)
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (img.width < 1000 || img.height < 400) {
            toast.warn("The image resolution is low. For best results, use at least 1200x500px.");
          }
        };

        setValue('image', acceptedFiles, { shouldValidate: true });
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
      }
    },
    [setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.svg', '.webp'],
    },
    maxFiles: 1,
  });

  useEffect(() => {
    if (watchImage && watchImage[0] && watchImage[0] instanceof File) {
      const file = watchImage[0];
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (watchImage !== 'existing') {
        setPreviewImage(null);
    }
  }, [watchImage]);

  const fetchBanners = async (search?: string) => {
    try {
      setIsFetching(true);
      const params: any = {};
      if (search) params.search = search;

      const res = await api.get(endPointApi.getAllBanners, { params });
      if (res.data?.data) {
        const transformedData = res.data.data.map((item: any) => ({
          ...item,
          id: item.id || item._id,
        }));
        setBanners(transformedData);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to fetch banners");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 3 || debouncedSearch.length === 0) {
      fetchBanners(debouncedSearch);
    }
  }, [debouncedSearch]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) {
      return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
    }
    return imagePath;
  };

  const onSubmit = async (data: BannerFormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subtitle", data.subtitle || "");
      formData.append("description", data.description || "");
      formData.append("color", data.color || "bg-blue-900");
      formData.append("link", data.link || "");
      formData.append("status", data.status);

      if (data.image && data.image[0] instanceof File) {
        formData.append("image", data.image[0]);
      }

      let success = false;
      if (editingId) {
        const res = await api.put(`${endPointApi.updateBanner}/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        success = !!res.data;
      } else {
        const res = await api.post(endPointApi.createBanner, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        success = !!res.data;
      }

      if (success) {
        toast.success(`Banner ${editingId ? 'updated' : 'created'} successfully`);
        reset({
          title: "",
          subtitle: "",
          description: "",
          color: "bg-blue-900",
          link: "",
          status: "active",
          image: undefined
        });
        setPreviewImage(null);
        setEditingId(null);
        await fetchBanners(debouncedSearch);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.response?.data?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (banner: BannerRow) => {
    setEditingId(banner._id || banner.id);
    setValue("title", banner.title);
    setValue("subtitle", banner.subtitle || "");
    setValue("description", banner.description || "");
    setValue("color", banner.color || "bg-blue-900");
    setValue("link", banner.link || "");
    setValue("status", banner.status);
    setValue("image", "existing"); 
    setPreviewImage(null);
    clearErrors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (banner: BannerRow) => {
    setBannerToDelete(banner);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`${endPointApi.deleteBanner}/${bannerToDelete._id || bannerToDelete.id}`);
      toast.success('Banner deleted successfully');
      if (editingId === (bannerToDelete._id || bannerToDelete.id)) {
        handleCancelEdit();
      }
      setShowDeletePopup(false);
      setBannerToDelete(null);
      await fetchBanners(debouncedSearch);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete banner');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPreviewImage(null);
    reset({
      title: "",
      subtitle: "",
      description: "",
      color: "bg-blue-900",
      link: "",
      status: "active",
      image: undefined
    });
  };

  const columnDefs: ColDef<BannerRow>[] = [
    {
      headerName: "Banner Info",
      field: "title",
      minWidth: 400,
      flex: 1,
      cellRenderer: (params: { data: BannerRow }) => {
        const imageUrl = getImageUrl(params.data.image);
        return (
          <div className="flex items-center gap-4 h-full py-2">
            <div className="flex-shrink-0">
              <img
                src={imageUrl || ""}
                alt={params.data.title}
                className="w-12 h-8 rounded object-cover border border-slate-200 shadow-sm"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/120x50?text=No+Image'; }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-slate-700 text-sm truncate">{params.data.title}</span>
              {params.data.subtitle && <span className="text-xs text-slate-400 truncate">{params.data.subtitle}</span>}
            </div>
          </div>
        );
      }
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (params: { value: string }) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-semibold",
          params.value === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {params.value.toUpperCase()}
        </span>
      ),
    },
    {
      headerName: "Action",
      width: 100,
      pinned: "right",
      cellRenderer: (params: { data: BannerRow }) => (
        <ActionButtons onEdit={() => handleEdit(params.data)} onDelete={() => handleDeleteClick(params.data)} />
      )
    },
  ];

  if (isFetching && banners.length === 0) return <PageLoader />;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Banner Management</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="sticky top-16 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{editingId ? 'Edit Banner' : 'New Banner'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update banner details' : 'Add a new banner to the homepage carousel.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Banner Title</label>
                  <Input {...register("title")} placeholder="Main title" error={errors.title?.message} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Subtitle</label>
                  <Input {...register("subtitle")} placeholder="Secondary text" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea 
                    {...register("description")} 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]" 
                    placeholder="Short description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Background Color</label>
                    <Input {...register("color")} placeholder="bg-blue-900" />
                  </div>
                   <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select 
                      {...register("status")}
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Link URL</label>
                  <Input {...register("link")} placeholder="https://..." />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Banner Image (1200x500)</label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dotted rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px]",
                      isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
                      errors.image ? "border-red-500 bg-red-50" : ""
                    )}
                  >
                    <input {...getInputProps()} />
                    {(previewImage || (editingId && banners.find(b => (b._id || b.id) === editingId)?.image)) ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img
                          src={previewImage || getImageUrl(banners.find(b => (b._id || b.id) === editingId)?.image || '') || ''}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 p-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-900">
                              <Edit size={14} /> Change
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <Plus className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Drag & drop or click</p>
                      </div>
                    )}
                  </div>
                  {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image.message as string}</p>}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 rounded-xl btn-primary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (editingId ? 'Update' : 'Publish')}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-slate-100 shadow-sm overflow-hidden h-[730px] flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Banners</CardTitle>
                <CardDescription>Homepage carousel banners</CardDescription>
              </div>
              <div className="relative w-64">
                <Input 
                  placeholder="Search banners..." 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10" 
                />
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <AgGridTable
                loading={isFetching}
                ref={gridRef}
                rowData={banners}
                columns={columnDefs as ColDef[]}
                onSelectionChange={setSelectedRows}
                gridHeight={650}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Banner?"
        description={`Are you sure you want to delete "${bannerToDelete?.title}"?`}
        isLoading={isDeleting}
        onCancel={() => setShowDeletePopup(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
