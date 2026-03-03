"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash, Loader2, X } from "lucide-react";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";
// import { format, parse } from "date-fns"; // Install date-fns: npm install date-fns

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import DatePicker from "@/components/ui/DatePicker";
import { ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import AgGridTable from "@/components/ui/AgGridTable";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";

const blogSchema = z.object({
  title: z.string().min(5, "Title is required"),
  sort_description: z.string().min(10, "Short description is required"),
  long_description: z.string().min(20, "Long description is required"),
  date: z.string().min(1, "Publish Date is required"),
    image: z.any().refine((files) => files && files.length > 0, "Image is required"),

});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogRow {
  id: string;
  title: string;
  image: string;
  description: string;
  blog_date: string; // This will be transformed to DD/MM/YYYY
  long_description?: string;
  // Add the raw date field if available
  raw_date?: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function BlogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<BlogRow[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(searchText, 600);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      date: "",
    },
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
    } else {
      setPreviewImage(null);
    }
  }, [watchImage]);

  // Fetch blogs on mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Search effect
  useEffect(() => {
    if (debouncedSearch) {
      fetchBlogs(debouncedSearch);
    } else {
      fetchBlogs();
    }
  }, [debouncedSearch]);

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';
    
    console.log("Original date from API:", dateString);
    
    try {
      // If it's already in DD/MM/YYYY format
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        return dateString;
      }
      
      // If it's in YYYY-MM-DD format (ISO)
      if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // If it's in YYYY-MM-DDTHH:mm:ss.sssZ format (ISO with time)
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // If it's a timestamp number
      if (!isNaN(Number(dateString))) {
        const date = new Date(Number(dateString));
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      // Try to parse with Date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }
    
    return dateString; // Return original if parsing fails
  };

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD for DatePicker
  const convertToDatePickerFormat = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // If it's in DD/MM/YYYY format
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // If it's already in YYYY-MM-DD format
      if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
        return dateString;
      }
      
      // Try to parse with Date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error("Error converting date:", error);
    }
    
    return dateString;
  };

  // GET ALL BLOGS API CALL
  const fetchBlogs = async (search?: string) => {
    try {
      setIsFetching(true);
      const params: any = {};
      if (search) params.search = search;

      const res = await api.get(endPointApi.getAllBlogs, { params });
      console.log("🚀 ~ fetchBlogs ~ raw response:", res.data);

      if (res.data?.data) {
        // Transform the data to ensure dates are in DD/MM/YYYY format
        const transformedData = res.data.data.map((item: any) => ({
          ...item,
          // Format the date to DD/MM/YYYY
          blog_date: formatDateToDDMMYYYY(item.blog_date || item.date || item.createdAt || ''),
        }));
        
        console.log("🚀 ~ fetchBlogs ~ transformed data:", transformedData);
        setBlogs(transformedData);
        setFilteredBlogs(transformedData);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
    } finally {
      setIsFetching(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http')) return imagePath;

    if (imagePath.startsWith('/uploads')) {
      return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
    }

    return imagePath;
  };

  // CREATE BLOG API CALL
  const createBlog = async (formData: FormData) => {
    try {
      const res = await api.post(endPointApi.createBlog, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data) {
        toast.success('Blog created successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error creating blog:", error);
      toast.error(error?.response?.data?.message || 'Failed to create blog');
      return false;
    }
  };

  // UPDATE BLOG API CALL
  const updateBlog = async (id: string, formData: FormData) => {
    try {
      const res = await api.put(
        `${endPointApi.updateBlog}/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data) {
        toast.success('Blog updated successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error updating blog:", error);
      toast.error(error?.response?.data?.message || 'Failed to update blog');
      return false;
    }
  };

  // DELETE BLOG API CALL
  const deleteBlog = async (id: string) => {
    try {
      const res = await api.delete(`${endPointApi.deleteBlog}/${id}`);

      if (res.data) {
        toast.success('Blog deleted successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error deleting blog:", error);
      toast.error(error?.response?.data?.message || 'Failed to delete blog');
      return false;
    }
  };

  const onSubmit = async (data: BlogFormValues) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("sort_description", data.sort_description);
      formData.append("long_description", data.long_description);
      
      // Send date in the format your backend expects
      // If backend expects YYYY-MM-DD, send as is
      // If backend expects DD/MM/YYYY, convert accordingly
      formData.append("date", data.date); // Adjust based on backend requirement
      console.log("📅 Sending date to API:", data.date);

      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      let success;
      if (editingId) {
        success = await updateBlog(editingId, formData);
      } else {
        success = await createBlog(formData);
      }

      if (success) {
        reset();
        setPreviewImage(null);
        setEditingId(null);
        await fetchBlogs(debouncedSearch);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.response?.data?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (blog: BlogRow) => {
    try {
      setIsFetching(true);
      // Fetch full blog details for editing
      const res = await api.get(`${endPointApi.getBlogById}/${blog.id}`);
      console.log("🚀 ~ handleEdit ~ full blog data:", res.data);

      if (res.data?.blog_data) {
        const blogData = res.data.blog_data;
        setEditingId(blogData.id);
        setValue("title", blogData.title);
        setValue("sort_description", blogData.description);
        setValue("long_description", blogData.long_description || "");

        // Convert the date from whatever format to YYYY-MM-DD for DatePicker
        if (blogData.blog_date) {
          const datePickerDate = convertToDatePickerFormat(blogData.blog_date);
          console.log("📅 Setting date in form:", datePickerDate);
          setValue("date", datePickerDate);
        }

        setValue("image", "existing"); // Placeholder to indicate existing image
        setPreviewImage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error fetching blog details:", error);
      toast.error("Failed to fetch blog details");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDeleteClick = (blog: BlogRow) => {
    setBlogToDelete(blog);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;

    setIsDeleting(true);
    const success = await deleteBlog(blogToDelete.id);
    if (success) {
      setShowDeletePopup(false);
      setBlogToDelete(null);
      await fetchBlogs(debouncedSearch);
    }
    setIsDeleting(false);
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setBlogToDelete(null);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPreviewImage(null);
    reset();
  };

  // Custom Image Component to prevent infinite loop
  const SafeImage = ({ src, alt, className }: { src: string | null; alt: string; className: string }) => {
    const [imgError, setImgError] = useState(false);

    if (!src || imgError) {
      return (
        <div className={`${className} bg-slate-100 flex items-center justify-center border border-slate-200`}>
          <span className="text-xs text-slate-400">No img</span>
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  };

  const columnDefs: ColDef<BlogRow>[] = [
    {
      headerName: "Blog Post",
      width: 600,
      cellRenderer: (params: { data: BlogRow }) => {
        const imageUrl = getImageUrl(params.data.image);

        return (
          <div className="flex items-center gap-4 h-full py-2">
            <div className="flex-shrink-0">
              <SafeImage
                src={imageUrl}
                alt={params.data.title}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-700 text-sm">
                {params.data.title}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      field: "blog_date",
      headerName: "Date",
      width: 200,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full gap-1.5">
          <span className="text-sm text-slate-600">
            {params.value || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      headerName: "Action",
      width: 200,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data: BlogRow }) => (
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
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Blog Management</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-16 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? 'Edit Blog Post' : 'New Blog Post'}
              </CardTitle>
              <CardDescription>
                {editingId
                  ? 'Update your blog post details'
                  : 'Create a new article for your audience.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-semibold text-slate-700">
                    Article Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    className="h-10 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("title")}
                    error={errors.title?.message}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="sort_description" className="text-sm font-semibold text-slate-700">
                    Short Description
                  </label>
                  <textarea
                    id="sort_description"
                    rows={3}
                    className={cn(
                      "flex w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans",
                      errors.sort_description ? "border-red-500 focus-visible:ring-red-500/20" : ""
                    )}
                    placeholder="Brief overview of the post..."
                    {...register("sort_description")}
                  />
                  {errors.sort_description && (
                    <p className="text-xs text-red-500 mt-1">{errors.sort_description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="long_description" className="text-sm font-semibold text-slate-700">
                    Long Description
                  </label>
                  <textarea
                    id="long_description"
                    rows={5}
                    className={cn(
                      "flex w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans",
                      errors.long_description ? "border-red-500 focus-visible:ring-red-500/20" : ""
                    )}
                    placeholder="Detailed content of the post..."
                    {...register("long_description")}
                  />
                  {errors.long_description && (
                    <p className="text-xs text-red-500 mt-1">{errors.long_description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-semibold text-slate-700">
                    Publish Date
                  </label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                        {fieldState.error && (
                          <p className="text-xs text-red-500 mt-1">{fieldState.error.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* Image Upload Field */}
                <div className="space-y-2">
                  <label htmlFor="blog-image" className="text-sm font-semibold text-slate-700">
                    Featured Image
                  </label>

                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dotted rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer transition-all w-full min-h-[160px]",
                      isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
                      errors.image ? "border-red-500 bg-red-50" : ""
                    )}
                  >
                    <input {...getInputProps()} />

                    {/* Show Preview Image (New or Existing) */}
                    {(previewImage || (editingId && !previewImage && blogs.find(b => b.id === editingId)?.image)) ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <SafeImage
                          src={previewImage || getImageUrl(blogs.find(b => b.id === editingId)?.image || '')}
                          alt="Featured"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                               <div className="flex gap-2">
                                                <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = previewImage || getImageUrl(blogs.find(b => b.id === editingId)?.image || '');
                            setModalImageUrl(url);
                            setImageModalOpen(true);
                          }}
                           className="bg-white/90 p-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-white"
                             title="View Image"
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
                        <div className="bg-slate-100 p-3 rounded-full mb-2 group-hover:bg-slate-200 transition-colors">
                          <Plus className="h-6 w-6 text-slate-500" />
                        </div>
                        {isDragActive ? (
                          <p className="text-sm font-medium text-primary">Drop the image here...</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-700">
                              Click or drag image to upload
                            </p>
                            <p className="text-xs text-slate-500">
                              SVG, PNG, JPG (max. 5MB)
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
                      : 'Upload an image for the blog post (JPEG, PNG, etc.)'}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-xl btn-primary"
                    disabled={isLoading || isFetching}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingId ? 'Updating...' : 'Publishing...'}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingId ? 'Update Blog' : 'Publish Post'}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 rounded-xl"
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
          <Card className="border-slate-100 shadow-sm overflow-hiddenflex flex-col" style={{ height: '774px' }}>
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Blog Posts</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {filteredBlogs.length} posts
                    {searchText && ` • Searching: "${searchText}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedRows.length === 0}
                    onClick={async () => {
                      if (selectedRows.length === 0) return;
                      if (!confirm(`Delete ${selectedRows.length} selected blogs?`)) return;

                      try {
                        const ids = selectedRows.map(r => r.id).filter(Boolean);
                        const res = await api.delete(endPointApi.bulkDeleteBlog, {
                          data: { ids }
                        });

                        if (res?.data?.message || res?.data?.success) {
                          toast.success(`${selectedRows.length} blog${selectedRows.length > 1 ? 's' : ''} deleted successfully`);
                          setSelectedRows([]);
                          await fetchBlogs();
                        } else {
                          toast.error(res?.data?.message || 'Bulk delete failed');
                        }
                      } catch (error: any) {
                        console.error("Bulk delete error:", error);
                        toast.error(error?.response?.data?.message || 'Failed to delete selected blogs');
                      }
                    }}
                  >
                    Delete Selected ({selectedRows.length})
                  </Button>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search blogs..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 text-sm"
                    />
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    {searchText && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
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
                      {searchText ? 'Searching...' : 'Loading blogs...'}
                    </p>
                  </div>
                </div>
              ) : filteredBlogs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="text-center">
                    <p className="text-slate-500 mb-2">
                      {searchText
                        ? `No blogs found matching "${searchText}"`
                        : 'No blogs found'}
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
                  rowData={filteredBlogs}
                  columns={columnDefs as any}
                  onSelectionChange={(selected) => {
                    setSelectedRows(selected);
                  }}
                  enableSearch={false}
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
        title="Delete Blog Post?"
        description={blogToDelete ? `Are you sure you want to delete "${blogToDelete.title}"? This action cannot be undone.` : "This action cannot be undone."}
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