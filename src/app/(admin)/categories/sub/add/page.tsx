"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, X, Edit, Minus } from "lucide-react";
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
  gst: z.number().min(0),
  hsnCodes: z.any().optional(),
  image: z.any().refine(
    (val) => {
      if (val === 'existing') return true;
      if (val && val[0] instanceof File) return true;
      if (val instanceof File) return true;
      return false;
    },
    { message: "Image is required" }
  ),
});

type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

interface SubCategorySeoBullet {
  label: string;
  text: string;
  plain?: boolean;
}

interface SubCategorySeoSection {
  heading: string;
  heading_level: "h2" | "h3";
  bullets: SubCategorySeoBullet[];
}

interface SubCategorySeoFaq {
  question: string;
  answer: string;
}

interface SubCategorySeoContent {
  meta_title: string;
  meta_description: string;
  core_keyword: string;
  secondary_keywords: string;
  image_alt: string;
  image_title: string;
  anchor_tags: string[];
  faqs: SubCategorySeoFaq[];
  hero_title: string;
  hero_text: string;
  intro_heading: string;
  intro_paragraphs: string[];
  sections: SubCategorySeoSection[];
  main_text: string;
  sub_text: string;
}

const emptySubCategorySeoSection = (): SubCategorySeoSection => ({
  heading: "",
  heading_level: "h2",
  bullets: [{ label: "", text: "", plain: false }],
});

const emptySubCategoryLabeledBullet = (): SubCategorySeoBullet => ({
  label: "",
  text: "",
  plain: false,
});

const emptySubCategoryPlainBullet = (): SubCategorySeoBullet => ({
  label: "",
  text: "",
  plain: true,
});

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
  seo_content?: SubCategorySeoContent;
}

const createEmptySubCategorySeoContent = (): SubCategorySeoContent => ({
  meta_title: "",
  meta_description: "",
  core_keyword: "",
  secondary_keywords: "",
  image_alt: "",
  image_title: "",
  anchor_tags: [],
  faqs: [{ question: "", answer: "" }],
  hero_title: "",
  hero_text: "",
  intro_heading: "",
  intro_paragraphs: [""],
  sections: [emptySubCategorySeoSection()],
  main_text: "",
  sub_text: "",
});

const normalizeSubCategorySeoContent = (seo?: SubCategorySeoContent | any | null): SubCategorySeoContent => {
  if (!seo) return createEmptySubCategorySeoContent();

  const introParagraphs = Array.isArray(seo.intro_paragraphs) && seo.intro_paragraphs.length > 0
    ? seo.intro_paragraphs.map((p: string) => String(p || ""))
    : seo.intro_text
      ? [String(seo.intro_text)]
      : [""];

  const sections =
    Array.isArray(seo.sections) && seo.sections.length > 0
      ? seo.sections.map((section: any) => {
          const heading = section.heading || section.h2 || "";
          const heading_level = section.heading_level === "h3" ? "h3" : "h2";

          let bullets: SubCategorySeoBullet[] = [];
          if (Array.isArray(section.bullets) && section.bullets.length > 0) {
            bullets = section.bullets.map((b: any) => {
              const label = b.label || "";
              const text = b.text || "";
              const plain = Boolean(b.plain) || (!label.trim() && Boolean(text.trim()));
              return { label: plain ? "" : label, text, plain };
            });
          } else if (Array.isArray(section.paragraphs)) {
            bullets = section.paragraphs.map((line: string) => {
              const content = String(line || "").trim().replace(/^[●•\-*]\s+/, "");
              const colon = content.indexOf(":");
              if (colon > 0) {
                return {
                  label: content.slice(0, colon).replace(/\*\*/g, "").trim(),
                  text: content.slice(colon + 1).trim(),
                };
              }
              return { label: "", text: content, plain: true };
            });
          }

          if (bullets.length === 0) bullets = [emptySubCategoryLabeledBullet()];

          return { heading, heading_level, bullets };
        })
      : [emptySubCategorySeoSection()];

  return {
    meta_title: seo.meta_title || "",
    meta_description: seo.meta_description || "",
    core_keyword: seo.core_keyword || "",
    secondary_keywords: seo.secondary_keywords || "",
    image_alt: seo.image_alt || "",
    image_title: seo.image_title || "",
    anchor_tags: Array.isArray(seo.anchor_tags) ? seo.anchor_tags : [],
    faqs: Array.isArray(seo.faqs) && seo.faqs.length > 0
      ? seo.faqs.map((f: any) => ({
          question: f.question || "",
          answer: f.answer || "",
        }))
      : [{ question: "", answer: "" }],
    hero_title: seo.hero_title || "",
    hero_text: seo.hero_text || "",
    intro_heading: seo.intro_heading || "",
    intro_paragraphs: introParagraphs,
    sections,
    main_text: seo.main_text || "",
    sub_text: seo.sub_text || "",
  };
};



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
  hsnCodes?: { materialType: string; code: string }[];
  gst?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  seo_content?: any;
}

interface SubCategoryRow {
  id: string;
  name: string;
  parent: string;
  parentId: string;
  image: string;
  hsnCodes?: { materialType: string; code: string }[];
  gst?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  seo_content?: any;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Compress image using Canvas API (skip SVG/GIF)
const compressImage = (file: File, maxSizeKB = 1024, quality = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') { resolve(file); return; }
    if (file.size <= maxSizeKB * 1024) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX_DIM = 1920;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
            else resolve(file);
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
  const [seoContent, setSeoContent] = useState<SubCategorySeoContent>(createEmptySubCategorySeoContent());
  const gridRef = useRef<any>(null);

  const updateSeoField = (
    field: keyof Omit<SubCategorySeoContent, "sections" | "intro_paragraphs" | "faqs" | "anchor_tags">,
    value: string
  ) => {
    setSeoContent((prev) => ({ ...prev, [field]: value }));
  };

  const addSeoFaq = () => {
    setSeoContent((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const removeSeoFaq = (index: number) => {
    setSeoContent((prev) => {
      if (prev.faqs.length <= 1) return prev;
      return { ...prev, faqs: prev.faqs.filter((_, i) => i !== index) };
    });
  };

  const updateSeoFaq = (index: number, field: "question" | "answer", value: string) => {
    setSeoContent((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    }));
  };

  const addIntroParagraph = () => {
    setSeoContent((prev) => ({
      ...prev,
      intro_paragraphs: [...prev.intro_paragraphs, ""],
    }));
  };

  const removeIntroParagraph = (index: number) => {
    setSeoContent((prev) => {
      if (prev.intro_paragraphs.length <= 1) return prev;
      return {
        ...prev,
        intro_paragraphs: prev.intro_paragraphs.filter((_, i) => i !== index),
      };
    });
  };

  const updateIntroParagraph = (index: number, value: string) => {
    setSeoContent((prev) => ({
      ...prev,
      intro_paragraphs: prev.intro_paragraphs.map((p, i) => (i === index ? value : p)),
    }));
  };

  const addSeoSection = (level: "h2" | "h3" = "h2") => {
    setSeoContent((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...emptySubCategorySeoSection(), heading_level: level }],
    }));
  };

  const removeSeoSection = (sectionIndex: number) => {
    setSeoContent((prev) => {
      if (prev.sections.length <= 1) return prev;
      return {
        ...prev,
        sections: prev.sections.filter((_, index) => index !== sectionIndex),
      };
    });
  };

  const updateSeoSectionHeading = (sectionIndex: number, value: string) => {
    setSeoContent((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, heading: value } : section
      ),
    }));
  };

  const updateSeoSectionLevel = (sectionIndex: number, level: "h2" | "h3") => {
    setSeoContent((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, heading_level: level } : section
      ),
    }));
  };

  const addSeoBullet = (sectionIndex: number, plain = false) => {
    setSeoContent((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              bullets: [
                ...section.bullets,
                plain ? emptySubCategoryPlainBullet() : emptySubCategoryLabeledBullet(),
              ],
            }
          : section
      ),
    }));
  };

  const removeSeoBullet = (sectionIndex: number, bulletIndex: number) => {
    setSeoContent((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex || section.bullets.length <= 1) return section;
        return {
          ...section,
          bullets: section.bullets.filter((_, bIndex) => bIndex !== bulletIndex),
        };
      }),
    }));
  };

  const updateSeoBullet = (
    sectionIndex: number,
    bulletIndex: number,
    field: "label" | "text",
    value: string
  ) => {
    setSeoContent((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          bullets: section.bullets.map((bullet, bIndex) =>
            bIndex === bulletIndex ? { ...bullet, [field]: value } : bullet
          ),
        };
      }),
    }));
  };


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
      gst: 0,
      hsnCodes: [{ materialType: "", code: "" }],
    }
  });

  const watchImage = watch('image');

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors?.[0];
        if (err?.code === 'file-too-large') toast.error('File is too large. Maximum size is 10MB.');
        else if (err?.code === 'file-invalid-type') toast.error('Invalid file type. Please upload SVG, PNG, JPG, JPEG, or WEBP.');
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = await compressImage(acceptedFiles[0], 1024, 0.85);
        setValue('image', [file], { shouldValidate: true });
        setPreviewImage(URL.createObjectURL(file));
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
    maxSize: 10 * 1024 * 1024,
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
                hsnCodes: sub.hsnCodes || [],
                gst: sub.gst || 0,
                status: "Active",
                created_at: sub.created_at || sub.createdAt || new Date().toISOString(),
                updated_at: sub.updated_at || sub.updatedAt || new Date().toISOString(),
                seo_content: sub.seo_content,
              });
            });
          }
        });
        setSubCategories(allSubCategories);
      }
    } catch (error) {
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
      if (data.gst !== undefined) {
        formData.append("gst", String(data.gst));
      }
      if (data.hsnCodes) {
        const cleanedHsnCodes = (data.hsnCodes as any[]).filter(h => h.materialType?.trim() && h.code?.trim());
        formData.append("hsnCodes", JSON.stringify(cleanedHsnCodes));
      }

      const cleanedSeo: SubCategorySeoContent = {
        ...seoContent,
        faqs: seoContent.faqs
          .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
          .filter((f) => f.question || f.answer),
        intro_paragraphs: seoContent.intro_paragraphs
          .map((p) => p.trim())
          .filter(Boolean),
        sections: seoContent.sections
          .map((section) => ({
            ...section,
            heading: section.heading.trim(),
            bullets: section.bullets
              .map((b) => ({
                label: b.plain ? "" : b.label.trim(),
                text: b.text.trim(),
                plain: Boolean(b.plain),
              }))
              .filter((b) => b.label || b.text),
          }))
          .filter((section) => section.heading || section.bullets.length > 0),
      };
      formData.append("seo_content", JSON.stringify(cleanedSeo));

      if (data.image && data.image[0] instanceof File) {
        formData.append("image", data.image[0]);
      }

      const res = await api.post(endPointApi.createSubCategory, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data) {
        toast.success("Sub-category created successfully");

        fetchCategories();
        reset({
          categoryId: "",
          name: "",
          gst: 0,
          hsnCodes: [{ materialType: "", code: "" }],
          image: undefined
        });
        setPreviewImage(null);
        setSeoContent(createEmptySubCategorySeoContent());
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create sub-category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subCategory: SubCategoryRow) => {
    setEditingSubCategory(subCategory);
    setValue("categoryId", subCategory.parentId);
    setValue("name", subCategory.name);
    setValue("gst", subCategory.gst || 0);
    setValue("hsnCodes", Array.isArray(subCategory.hsnCodes) && subCategory.hsnCodes.length > 0 ? subCategory.hsnCodes : [{ materialType: "", code: "" }]);
    setValue("image", "existing");
    setSeoContent(normalizeSubCategorySeoContent(subCategory.seo_content));
    clearErrors();
    setPreviewImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (data: SubCategoryFormValues) => {
    if (!editingSubCategory) return;

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("id", data.categoryId);
      formData.append("name", data.name);
      if (data.gst !== undefined) {
        formData.append("gst", String(data.gst));
      }
      if (data.hsnCodes) {
        const cleanedHsnCodes = (data.hsnCodes as any[]).filter(h => h.materialType?.trim() && h.code?.trim());
        formData.append("hsnCodes", JSON.stringify(cleanedHsnCodes));
      }

      const cleanedSeo: SubCategorySeoContent = {
        ...seoContent,
        faqs: seoContent.faqs
          .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
          .filter((f) => f.question || f.answer),
        intro_paragraphs: seoContent.intro_paragraphs
          .map((p) => p.trim())
          .filter(Boolean),
        sections: seoContent.sections
          .map((section) => ({
            ...section,
            heading: section.heading.trim(),
            bullets: section.bullets
              .map((b) => ({
                label: b.plain ? "" : b.label.trim(),
                text: b.text.trim(),
                plain: Boolean(b.plain),
              }))
              .filter((b) => b.label || b.text),
          }))
          .filter((section) => section.heading || section.bullets.length > 0),
      };
      formData.append("seo_content", JSON.stringify(cleanedSeo));

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
        toast.success("Sub-category updated successfully");

        fetchCategories();
        setEditingSubCategory(null);
        reset({
          categoryId: "",
          name: "",
          gst: 0,
          hsnCodes: [{ materialType: "", code: "" }],
          image: undefined
        });
        setPreviewImage(null);
        setSeoContent(createEmptySubCategorySeoContent());
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update sub-category");
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
            hsnCodes: [{ materialType: "", code: "" }],
            image: undefined
          }); // Clear the form
        }

        toast.success('Sub-category deleted successfully');
        fetchCategories();
        setShowDeletePopup(false);
        setSubCategoryToDelete(null);
      }
    } catch (error: any) {
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
      field: "hsnCodes",
      headerName: "HSN Codes",
      minWidth: 200,
      cellClass: "ag-cell-with-border py-1",
      cellRenderer: (params: { data: SubCategoryRow }) => (
        <div className="flex flex-col text-xs space-y-1 h-full justify-center overflow-y-auto max-h-[100px]">
          {Array.isArray(params.data.hsnCodes) && params.data.hsnCodes.length > 0 ? (
            params.data.hsnCodes.map((item, idx) => (
              <span key={idx} className="bg-slate-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                {item.materialType}: <span className="font-medium">{item.code}</span>
              </span>
            ))
          ) : "-"}
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
      gst: 0,
      hsnCodes: [{ materialType: "", code: "" }],
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

                    <div className="space-y-1">
                      <label htmlFor="gst" className="text-xs font-semibold text-slate-700">
                        GST Rate (%)
                      </label>
                      <Input
                        id="gst"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 18"
                        className="h-9 bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all rounded-lg text-sm"
                        {...register("gst", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Material-wise HSN Codes
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2"
                          onClick={() => {
                            const current = watch("hsnCodes") || [];
                            setValue("hsnCodes", [...current, { materialType: "", code: "" }]);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add HSN
                        </Button>
                      </div>

                      {(watch("hsnCodes") || []).map((hsnItem: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Material (e.g. Wooden)"
                            className="h-9 bg-slate-50 border-slate-100 text-sm flex-1"
                            value={hsnItem.materialType}
                            onChange={(e) => {
                              const current = [...(watch("hsnCodes") || [])];
                              current[index].materialType = e.target.value;
                              setValue("hsnCodes", current);
                            }}
                          />
                          <Input
                            placeholder="HSN Code"
                            className="h-9 bg-slate-50 border-slate-100 text-sm flex-1"
                            value={hsnItem.code}
                            onChange={(e) => {
                              const current = [...(watch("hsnCodes") || [])];
                              current[index].code = e.target.value;
                              setValue("hsnCodes", current);
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const current = [...(watch("hsnCodes") || [])];
                              if (current.length > 1) {
                                current.splice(index, 1);
                                setValue("hsnCodes", current);
                              } else {
                                current[0] = { materialType: "", code: "" };
                                setValue("hsnCodes", current);
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
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
                                  SVG, PNG, JPG or GIF (max. 10MB)
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

                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-800">Category SEO Content</p>


                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Hero Title (H1)</label>
                        <Input
                          value={seoContent.hero_title}
                          onChange={(e) => updateSeoField("hero_title", e.target.value)}
                          placeholder="Stay Active with Affordable Sports Equipment Rental"
                          className="h-9 bg-slate-50 border-slate-100 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Hero Text</label>
                        <textarea
                          value={seoContent.hero_text}
                          onChange={(e) => updateSeoField("hero_text", e.target.value)}
                          placeholder="Fitness gear is expensive. Start your journey without spending too much."
                          rows={2}
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Intro Heading</label>
                        <Input
                          value={seoContent.intro_heading}
                          onChange={(e) => updateSeoField("intro_heading", e.target.value)}
                          placeholder="Introducing Upleex: Fitness That Fits Your Life"
                          className="h-9 bg-slate-50 border-slate-100 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">Intro Text</label>
                          <button
                            type="button"
                            onClick={addIntroParagraph}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add paragraph
                          </button>
                        </div>
                        {seoContent.intro_paragraphs.map((paragraph, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <textarea
                              value={paragraph}
                              onChange={(e) => updateIntroParagraph(index, e.target.value)}
                              placeholder="Intro paragraph text"
                              rows={2}
                              className="flex-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {seoContent.intro_paragraphs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeIntroParagraph(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md mt-1"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700">Content Sections</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => addSeoSection("h2")}
                              className="inline-flex items-center gap-1  text-xs font-semibold text-primary"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add H2
                            </button>
                            <button
                              type="button"
                              onClick={() => addSeoSection("h3")}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add H3
                            </button>
                          </div>
                        </div>

                        {seoContent.sections.map((section, sectionIndex) => (
                          <div
                            key={sectionIndex}
                            className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-2">
                               <div className="flex gap-2">
  <select
    value={section.heading_level}
    onChange={(e) =>
      updateSeoSectionLevel(
        sectionIndex,
        e.target.value as "h2" | "h3"
      )
    }
    className="h-9 w-20 rounded-lg border border-slate-100 bg-white px-2 text-xs font-semibold text-slate-700"
  >
    <option value="h2">H2</option>
    <option value="h3">H3</option>
  </select>

  <Input
    value={section.heading}
    onChange={(e) =>
      updateSeoSectionHeading(sectionIndex, e.target.value)
    }
    placeholder={
      section.heading_level === "h3"
        ? "Use Cases:"
        : "We Provide Affordable Sports Equipment Rental..."
    }
    className="h-9 flex-1 bg-white border-slate-100 text-sm"
  />
</div>
                              </div>
                              {seoContent.sections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSeoSection(sectionIndex)}
                                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="space-y-2 pl-1 border-l-2 border-slate-200">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-600">Bullet points</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => addSeoBullet(sectionIndex, false)}
                                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    Add
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => addSeoBullet(sectionIndex, true)}
                                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Text Only
                                    </button>
                                  </div>
                              </div>
                              {section.bullets.map((bullet, bulletIndex) => (
                                <div key={bulletIndex} className="flex gap-2 items-start">
                                  <div className="flex-1 grid grid-cols-1 gap-1.5">
                                    {bullet.plain ? (
                                      <Input
                                        value={bullet.text}
                                        onChange={(e) =>
                                          updateSeoBullet(
                                            sectionIndex,
                                            bulletIndex,
                                            "text",
                                            e.target.value
                                          )
                                        }
                                        placeholder=""
                                        className="h-8 bg-white border-slate-100 text-xs"
                                      />
                                    ) : (
                                      <>
                                        <Input
                                          value={bullet.label}
                                          onChange={(e) =>
                                            updateSeoBullet(
                                              sectionIndex,
                                              bulletIndex,
                                              "label",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Label "
                                          className="h-8 bg-white border-slate-100 text-xs"
                                        />
                                        <Input
                                          value={bullet.text}
                                          onChange={(e) =>
                                            updateSeoBullet(
                                              sectionIndex,
                                              bulletIndex,
                                              "text",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Description"
                                          className="h-8 bg-white border-slate-100 text-xs"
                                        />
                                      </>
                                    )}
                                  
                                  </div>
                                  {section.bullets.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeSeoBullet(sectionIndex, bulletIndex)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded-md mt-1"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>


                      <div className="space-y-2 border-t border-slate-100 pt-2">
                        <p className="text-xs font-bold text-slate-800">CTA</p>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Main Text</label>
                          <Input
                            value={seoContent.main_text}
                            onChange={(e) => updateSeoField("main_text", e.target.value)}
                            placeholder="Stay Fit Today with Upleex Rentals."
                            className="h-9 bg-slate-50 border-slate-100 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Sub Text</label>
                          <textarea
                            value={seoContent.sub_text}
                            onChange={(e) => updateSeoField("sub_text", e.target.value)}
                            placeholder="Find fitness gear near you and start your journey now."
                            rows={2}
                            className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
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
                     noRowsMessage="No sub category found"
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
