"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash, Loader2, Calendar, X } from "lucide-react";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  sort_description: z.string().min(10, "Short description must be at least 10 characters"),
  long_description: z.string().min(20, "Long description must be at least 20 characters"),
  date: z.string().min(1, "Please select a date"),
  image: z.any().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogRow {
  id: string;
  title: string;
  image: string;
  description: string;
  blog_date: string;
  long_description?: string;
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

  const debouncedSearch = useDebounce(searchText, 600);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
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
    if (watchImage && watchImage[0]) {
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

  // GET ALL BLOGS API CALL
  const fetchBlogs = async (search?: string) => {
    try {
      setIsFetching(true);
      const params: any = {};
      if (search) params.search = search;

      const res = await api.get(endPointApi.getAllBlogs, { params });
      console.log("🚀 ~ fetchBlogs ~ res:", res);

      // Check the response structure from your backend
      if (res.data?.data) {
        // Your backend transforms the data in getAllBlogs
        // It returns: { id, title, image, description, blog_date }
        setBlogs(res.data.data);
        setFilteredBlogs(res.data.data);
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
      formData.append("date", data.date);

      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      let success;
      if (editingId) {
        // Update existing blog
        success = await updateBlog(editingId, formData);
      } else {
        // Create new blog
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
      console.log("🚀 ~ handleEdit ~ res:", res);

      if (res.data?.blog_data) {
        const blogData = res.data.blog_data;
        setEditingId(blogData.id);
        setValue("title", blogData.title);
        setValue("sort_description", blogData.description);
        setValue("long_description", blogData.long_description || "");

        // Convert DD-MM-YYYY to YYYY-MM-DD for input
        if (blogData.blog_date) {
          const [day, month, year] = blogData.blog_date.split('-');
          setValue("date", `${year}-${month}-${day}`);
        }

        setValue("image", "");
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

  const handleImageClick = () => {
    document.getElementById('blog-image')?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('image', e.target.files);
    }
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
      flex: 2,
      cellRenderer: (params: { data: BlogRow }) => {
        const imageUrl = getImageUrl(params.data.image);

        return (
          <div className="flex items-center gap-4 h-full py-2">
            <div className="flex-shrink-0">
              <SafeImage
                src={imageUrl}
                alt={params.data.title}
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 text-base">
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
      width: 120,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full gap-1.5">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600">
            {params.value}
          </span>
        </div>
      )
    },
    {
      headerName: "Action",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data: BlogRow }) => (
        <div className="flex items-center justify-end gap-2 h-full pr-2">
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Blog Management</h2>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm">
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-semibold text-slate-700">
                    Article Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    className="h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
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
                  <Input
                    id="date"
                    type="date"
                    className="h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("date")}
                    error={errors.date?.message}
                  />
                </div>

                {/* Image Upload Field */}
                <div className="space-y-2">
                  <label htmlFor="blog-image" className="text-sm font-semibold text-slate-700">
                    Featured Image
                  </label>

                  {/* Show current image when editing */}
                  {editingId && !previewImage && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-2">Current Image:</p>
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                        <SafeImage
                          src={getImageUrl(blogs.find(b => b.id === editingId)?.image || '')}
                          alt="Current blog"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Show preview of new image */}
                  {previewImage && (
                    <div className="mb-3 relative inline-block">
                      <p className="text-xs text-slate-500 mb-2">New Image Preview:</p>
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setValue('image', undefined);
                        }}
                        className="absolute top-6 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors z-10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dotted rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors w-full h-32",
                      isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
                      errors.image ? "border-red-500 bg-red-50" : ""
                    )}
                  >
                    <input {...getInputProps()} />
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
                          SVG, PNG, JPG (max. 5MB)
                        </p>
                      </div>
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

                  {editingId && (
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
                  <CardTitle className="text-lg">Blog Posts</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {filteredBlogs.length} posts
                    {searchText && ` • Searching: "${searchText}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                <DataTable
                  rowData={filteredBlogs}
                  columnDefs={columnDefs}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && blogToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Delete Blog Post</h3>
              <button onClick={handleCancelDelete} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                {blogToDelete?.image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <SafeImage
                      src={getImageUrl(blogToDelete.image)}
                      alt={blogToDelete.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="text-gray-700">
                    Are you sure you want to delete <span className="font-semibold">"{blogToDelete?.title}"</span>?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelDelete} 
                className="px-6" 
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmDelete} 
                className="px-6 bg-red-600 hover:bg-red-700 text-white" 
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Blog'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}