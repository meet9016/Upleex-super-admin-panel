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

const faqSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  answer: z.string().min(20, "Answer must be at least 20 characters"),
});

type FAQFormValues = z.infer<typeof faqSchema>;

const initialFaqs = [
  { id: 1, question: "How to reset password?", answer: "Go to settings page and click reset password.", status: "Active" },
  { id: 2, question: "Where is my order?", answer: "Check your order status in the dashboard.", status: "Active" },
  { id: 3, question: "Is support available 24/7?", answer: "Yes, we providing support anytime.", status: "Inactive" },
];

interface FAQRow {
  id: number;
  question: string;
  answer: string;
  status: string;
}

export default function FAQPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [faqs, setFaqs] = useState(initialFaqs);

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
      field: "status", 
      headerName: "Status", 
      width: 120,
      cellRenderer: (params: { value: string }) => (
        <div className="flex items-center h-full">
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
            params.value === "Active" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : "bg-slate-50 text-slate-600 border-slate-100"
          )}>
            <span className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              params.value === "Active" ? "bg-emerald-500" : "bg-slate-400"
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
  } = useForm<FAQFormValues>({
    resolver: zodResolver(faqSchema),
  });

  const onSubmit = async (data: FAQFormValues) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newFaq = {
      id: faqs.length + 1,
      question: data.question,
      answer: data.answer,
      status: "Active"
    };
    setFaqs([newFaq, ...faqs]);
    setIsLoading(false);
    reset();
  };

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
              <CardTitle className="text-lg">Add New FAQ</CardTitle>
              <CardDescription>
                Provide clear answers to common user questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="question" className="text-sm font-semibold text-slate-700">Question</label>
                  <Input
                    id="question"
                    placeholder="e.g. How to track order?"
                    className="bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-xl"
                    {...register("question")}
                    error={errors.question?.message}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="answer" className="text-sm font-semibold text-slate-700">Answer</label>
                  <textarea
                    id="answer"
                    className="flex min-h-[140px] w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    placeholder="Provide the solution here..."
                    {...register("answer")}
                  />
                  {errors.answer && (
                    <p className="text-xs text-red-500 mt-1">{errors.answer.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Save FAQ
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
                <CardTitle className="text-lg">FAQ List</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search FAQs..." className="pl-9 h-9 w-48 bg-white border-slate-100 text-xs rounded-lg" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <DataTable
                rowData={faqs}
                columnDefs={columnDefs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
