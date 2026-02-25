"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Filter, Edit, Trash, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";

const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type BlogFormValues = z.infer<typeof blogSchema>;

const initialPosts = [
  { id: 1, title: "Modern Design Trends", author: "Admin", date: "2024-03-20", status: "Published" },
  { id: 2, title: "Next.js Security Guide", author: "Editor", date: "2024-03-18", status: "Draft" },
  { id: 3, title: "Mastering Tailwind CSS", author: "Admin", date: "2024-03-15", status: "Published" },
];

interface BlogRow {
  id: number;
  title: string;
  author: string;
  date: string;
  status: string;
}

export default function BlogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState(initialPosts);

  const columnDefs: ColDef<BlogRow>[] = [
    { 
      field: "title", 
      headerName: "Post Title", 
      flex: 2,
      cellStyle: { fontWeight: "600", color: "#1e293b", display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "author", 
      headerName: "Author", 
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center' }
    },
    { 
      field: "date", 
      headerName: "Date", 
      flex: 1,
      cellStyle: { color: "#64748b", display: 'flex', alignItems: 'center' }
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full">
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
            params.value === "Published" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : "bg-amber-50 text-amber-700 border-amber-100"
          )}>
            <span className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              params.value === "Published" ? "bg-emerald-500" : "bg-amber-500"
            )} />
            {params.value}
          </span>
        </div>
      )
    },
    {
      headerName: "Action",
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: () => (
        <div className="flex items-center justify-end gap-2 h-full pr-2">
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
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
  });

  const onSubmit = async (data: BlogFormValues) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newPost = {
      id: posts.length + 1,
      title: data.title,
      author: "Admin",
      date: new Date().toISOString().split('T')[0],
      status: "Published"
    };
    setPosts([newPost, ...posts]);
    setIsLoading(false);
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Blog Management</h2>
          <p className="text-muted-foreground mt-1 text-slate-500">Create and manage your blog posts.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">New Post</CardTitle>
              <CardDescription>
                Compose a new article for your audience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-semibold text-slate-700">Article Title</label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    className="bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("title")}
                    error={errors.title?.message}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold text-slate-700">Content Overview</label>
                  <textarea
                    id="description"
                    className="flex min-h-[120px] w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans"
                    placeholder="Write a brief overview..."
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Featured Image</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all hover:bg-slate-50 hover:border-primary/30 flex flex-col items-center justify-center cursor-pointer group">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Plus className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">Click to upload image</p>
                    <p className="text-[10px] text-slate-400 mt-1">SVG, PNG, JPG (max. 5MB)</p>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Publish Post
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
                <CardTitle className="text-lg">Recent Posts</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search articles..." className="pl-9 h-9 w-48 bg-white border-slate-100 text-xs rounded-lg" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <DataTable
                rowData={posts}
                columnDefs={columnDefs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
