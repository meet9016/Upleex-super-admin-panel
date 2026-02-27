"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Edit, Trash, Loader2, X } from "lucide-react";
import { MdSearch } from "react-icons/md";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ColDef } from "ag-grid-community";
import { cn } from "@/lib/utils";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

const faqSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  answer: z.string().min(20, "Answer must be at least 20 characters"),
});

type FAQFormValues = z.infer<typeof faqSchema>;

interface FAQRow {
  id: string;
  question: string;
  answer: string;
  status?: string;
  createdAt?: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function FAQPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [faqs, setFaqs] = useState<FAQRow[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  console.log("🚀 ~ FAQPage ~ editingId:", editingId)

  const debouncedSearch = useDebounce(searchText, 600);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FAQFormValues>({
    resolver: zodResolver(faqSchema),
  });

  // Fetch FAQs on mount
  useEffect(() => {
    fetchFAQs();
  }, []);

  // Search effect with backend API call
  useEffect(() => {
    if (debouncedSearch) {
      searchFAQs(debouncedSearch);
    } else {
      // If search is empty, fetch all FAQs
      fetchFAQs();
    }
  }, [debouncedSearch]);

  // GET ALL FAQs API CALL
  const fetchFAQs = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(endPointApi.getAllFAQs);
      console.log("🚀 ~ fetchFAQs ~ res:", res);
      
      if (res.data?.data) {
        const formattedFaqs = res.data.data.map((faq: any) => ({
          id: faq._id || faq.id, // Handle both _id and id
          question: faq.question,
          answer: faq.answer,
          status: "Active",
          createdAt: faq.createdAt,
        }));
        setFaqs(formattedFaqs);
        setFilteredFaqs(formattedFaqs);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("Failed to fetch FAQs");
    } finally {
      setIsFetching(false);
    }
  };

  // SEARCH FAQs API CALL
  const searchFAQs = async (searchTerm: string) => {
    try {
      setIsFetching(true);
      // Using the same endpoint but with search query parameter
      // Adjust the endpoint based on your backend API structure
      const res = await api.get(`${endPointApi.getAllFAQs}?search=${encodeURIComponent(searchTerm)}`);
      console.log("🚀 ~ searchFAQs ~ res:", res);
      
      if (res.data?.data) {
        const formattedFaqs = res.data.data.map((faq: any) => ({
          id: faq._id || faq.id,
          question: faq.question,
          answer: faq.answer,
          status: "Active",
          createdAt: faq.createdAt,
        }));
        setFilteredFaqs(formattedFaqs);
      }
    } catch (error) {
      console.error("Error searching FAQs:", error);
      toast.error("Failed to search FAQs");
    } finally {
      setIsFetching(false);
    }
  };

  // CREATE FAQ API CALL
  const createFAQ = async (data: FAQFormValues) => {
    try {
      const res = await api.post(endPointApi.createFAQ, data);
      
      if (res.data) {
        toast.success('FAQ created successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error creating FAQ:", error);
      toast.error(error?.response?.data?.message || 'Failed to create FAQ');
      return false;
    }
  };

  // UPDATE FAQ API CALL
  const updateFAQ = async (id: string, data: FAQFormValues) => {
    try {
      const res = await api.put(
        `${endPointApi.updateFAQ}/${id}`,
        data
      );
      
      if (res.data) {
        toast.success('FAQ updated successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error updating FAQ:", error);
      toast.error(error?.response?.data?.message || 'Failed to update FAQ');
      return false;
    }
  };

  // DELETE FAQ API CALL
  const deleteFAQ = async (id: string) => {
    try {
      const res = await api.delete(`${endPointApi.deleteFAQ}/${id}`);
      
      if (res.data) {
        toast.success('FAQ deleted successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error deleting FAQ:", error);
      toast.error(error?.response?.data?.message || 'Failed to delete FAQ');
      return false;
    }
  };

  const onSubmit = async (data: FAQFormValues) => {
    try {
      setIsLoading(true);
      
      let success;
      if (editingId) {
        // Update existing FAQ
        success = await updateFAQ(editingId, data);
      } else {
        // Create new FAQ
        success = await createFAQ(data);
      }

      if (success) {
        reset();
        setEditingId(null);
        // After successful operation, refresh the list
        if (searchText) {
          await searchFAQs(searchText);
        } else {
          await fetchFAQs();
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.response?.data?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (faq: FAQRow) => {
    console.log("🚀 ~ handleEdit ~ faq:", faq)
    setEditingId(faq.id);
    setValue("question", faq.question);
    setValue("answer", faq.answer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    const success = await deleteFAQ(id);
    if (success) {
      // After successful delete, refresh the list
      if (searchText) {
        await searchFAQs(searchText);
      } else {
        await fetchFAQs();
      }
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    fetchFAQs(); // Fetch all FAQs when search is cleared
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    reset();
  };

  const columnDefs: ColDef<FAQRow>[] = [
    { 
      field: "question", 
      headerName: "Question", 
      flex: 1.5,
      cellStyle: { fontWeight: "600", color: "#1e293b", display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "answer", 
      headerName: "Answer", 
      flex: 2,
      cellStyle: { color: "#64748b", fontSize: "0.8rem", display: 'flex', alignItems: 'center' }
    },
    {
      headerName: "Action",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data: FAQRow }) => (
        <div className="flex items-center justify-end gap-2 h-full pr-2">
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">FAQ Management</h2>
        <p className="text-muted-foreground mt-1 text-slate-500">Add and manage frequently asked questions.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? 'Edit FAQ' : 'Add New FAQ'}
              </CardTitle>
              <CardDescription>
                {editingId 
                  ? 'Update the FAQ details' 
                  : 'Provide clear answers to common user questions.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="question" className="text-sm font-semibold text-slate-700">
                    Question
                  </label>
                  <Input
                    id="question"
                    placeholder="e.g. How to track order?"
                    className="bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("question")}
                    error={errors.question?.message}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="answer" className="text-sm font-semibold text-slate-700">
                    Answer
                  </label>
                  <textarea
                    id="answer"
                    rows={5}
                    className="flex w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    placeholder="Provide the solution here..."
                    {...register("answer")}
                  />
                  {errors.answer && (
                    <p className="text-xs text-red-500 mt-1">{errors.answer.message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 h-11 rounded-xl btn-primary" 
                    disabled={isLoading || isFetching}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingId ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingId ? 'Update FAQ' : 'Save FAQ'}
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
                  <CardTitle className="text-lg">FAQ List</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {filteredFaqs.length} FAQs
                    {searchText && ` • Searching: "${searchText}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search FAQs..."
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
                      {searchText ? 'Searching...' : 'Loading FAQs...'}
                    </p>
                  </div>
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="text-center">
                    <p className="text-slate-500 mb-2">
                      {searchText
                        ? `No FAQs found matching "${searchText}"`
                        : 'No FAQs found'}
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
                  rowData={filteredFaqs}
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