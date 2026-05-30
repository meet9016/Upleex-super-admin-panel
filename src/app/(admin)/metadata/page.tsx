"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "react-toastify";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { apiService } from "@/services/api";

type UploadResult = {
  totalRows: number;
  updatedCategories: number;
  updatedSubCategories: number;
  skippedRows: number;
  jsonFile?: string;
  generatedAt?: string;
  unmatched: Array<{
    category: string;
    subCategory: string;
    coreKeyword: string;
  }>;
};

export default function MetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleDownloadJson = async () => {
    try {
      const response = (await apiService.getMetadataJson()) as {
        success: boolean;
        data: Record<string, unknown>;
      };
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "category-seo-metadata.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "JSON file not found. Upload CSV first.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    try {
      setLoading(true);
      const response = (await apiService.uploadMetadataCsv(file)) as {
        success: boolean;
        message: string;
        data: UploadResult;
      };
      setResult(response.data);
      toast.success(response.message || "Metadata uploaded successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload metadata CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Metadata</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload keyword CSV — it converts to JSON and updates category/sub-category SEO in database.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          JSON file location: <code className="bg-slate-100 px-1 rounded">upleex-backend/data/category-seo-metadata.json</code>
        </p>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Upload Metadata CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100">
            <FileSpreadsheet className="h-5 w-5 text-slate-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {file ? file.name : "Choose CSV file"}
              </p>
              <p className="text-xs text-slate-500">
                Expected columns: Category, Sub Category, Meta Title, Meta Description, Core Keyword, FAQ, Image Alt Tag, Image Title
              </p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleUpload} disabled={loading || !file} className="btn-primary">
              {loading ? (
                "Uploading..."
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload CSV → JSON + Apply
                </span>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadJson}>
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download JSON
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Last Upload Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Total Rows</p>
                <p className="text-lg font-semibold text-slate-900">{result.totalRows}</p>
              </div>
              <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                <p className="text-xs text-green-700">Updated Categories</p>
                <p className="text-lg font-semibold text-green-800">{result.updatedCategories}</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">Updated Sub-Categories</p>
                <p className="text-lg font-semibold text-blue-800">{result.updatedSubCategories}</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Skipped Rows</p>
                <p className="text-lg font-semibold text-amber-800">{result.skippedRows}</p>
              </div>
            </div>

            {result.unmatched.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800 inline-flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Unmatched rows (first {result.unmatched.length})
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-900">
                  {result.unmatched.map((item, index) => (
                    <li key={`${item.category}-${item.subCategory}-${index}`}>
                      Category: <strong>{item.category || "-"}</strong> | Sub: <strong>{item.subCategory || "-"}</strong> | Keyword: {item.coreKeyword || "-"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.jsonFile && (
              <p className="text-sm text-slate-600">
                JSON saved as <strong>{result.jsonFile}</strong>
                {result.generatedAt ? ` at ${new Date(result.generatedAt).toLocaleString()}` : ""}
              </p>
            )}

            {result.skippedRows === 0 && (
              <p className="text-sm text-green-700 inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                All rows matched and applied successfully.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
