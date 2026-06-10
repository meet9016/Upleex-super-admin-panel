"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, Plus, Trash2, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface CategorySeoBullet {
  label: string;
  text: string;
  plain?: boolean;
}

interface CategorySeoSection {
  heading: string;
  heading_level: "h2" | "h3";
  bullets: CategorySeoBullet[];
}

interface CategorySeoContent {
  meta_title: string;
  meta_description: string;
  core_keyword: string;
  secondary_keywords: string;
  image_alt: string;
  image_title: string;
  anchor_tags: string[];
  hero_title: string;
  hero_text: string;
  intro_heading: string;
  intro_paragraphs: string[];
  sections: CategorySeoSection[];
  main_text: string;
  sub_text: string;
}

const emptySeoSection = (): CategorySeoSection => ({
  heading: "",
  heading_level: "h2",
  bullets: [{ label: "", text: "", plain: false }],
});

const emptyLabeledBullet = (): CategorySeoBullet => ({
  label: "",
  text: "",
  plain: false,
});

const emptyPlainBullet = (): CategorySeoBullet => ({
  label: "",
  text: "",
  plain: true,
});

const createEmptySeoContent = (): CategorySeoContent => ({
  meta_title: "",
  meta_description: "",
  core_keyword: "",
  secondary_keywords: "",
  image_alt: "",
  image_title: "",
  anchor_tags: [],
  hero_title: "",
  hero_text: "",
  intro_heading: "",
  intro_paragraphs: [""],
  sections: [emptySeoSection()],
  main_text: "",
  sub_text: "",
});

export default function ServiceSeoContentPage() {
  const [seoContent, setSeoContent] = useState<CategorySeoContent>(createEmptySeoContent());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(endPointApi.getDynamicPageBySlug.replace(":slug", "services-list"));
      if (res.data?.data?.content) {
        try {
          const parsed = JSON.parse(res.data.data.content);
          if (parsed && typeof parsed === 'object') {
             setSeoContent({ ...createEmptySeoContent(), ...parsed });
          }
        } catch(e) {
          console.error("Failed to parse JSON content", e);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load service SEO content");
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const cleanedSeo: CategorySeoContent = {
        ...seoContent,
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

      const payload = {
        slug: "services-list",
        title: "Services List SEO Content",
        content: JSON.stringify(cleanedSeo),
      };

      const res = await api.post(endPointApi.upsertDynamicPage, payload);
      if (res.data?.success) {
        toast.success("Service SEO Content saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save content");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSeoField = (
    field: keyof CategorySeoContent,
    value: string
  ) => {
    setSeoContent((prev) => ({ ...prev, [field]: value }));
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
      sections: [...prev.sections, { ...emptySeoSection(), heading_level: level }],
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
                plain ? emptyPlainBullet() : emptyLabeledBullet(),
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

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Service SEO Content</h2>
          <p className="text-sm text-slate-500 mt-1">Manage the content that appears on the user panel Services page.</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading || isFetching} className="h-10 rounded-xl btn-primary">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Content
        </Button>
      </div>

      {isFetching ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
            <CardTitle className="text-lg">SEO Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Hero Title (H1)</label>
              <Input
                value={seoContent.hero_title}
                onChange={(e) => updateSeoField("hero_title", e.target.value)}
                placeholder="Stay Active with Affordable Sports Equipment Rental"
                className="h-9 bg-slate-50 border-slate-100 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Hero Text</label>
              <textarea
                value={seoContent.hero_text}
                onChange={(e) => updateSeoField("hero_text", e.target.value)}
                placeholder="Fitness gear is expensive. Start your journey without spending too much."
                rows={2}
                className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Intro Heading</label>
              <Input
                value={seoContent.intro_heading}
                onChange={(e) => updateSeoField("intro_heading", e.target.value)}
                placeholder="Introducing Upleex: Fitness That Fits Your Life"
                className="h-9 bg-slate-50 border-slate-100 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Intro Text</label>
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

            <div className="space-y-2 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-700">Content Sections</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addSeoSection("h2")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
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
                  className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 space-y-3 mt-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={section.heading_level}
                          onChange={(e) => updateSeoSectionLevel(sectionIndex, e.target.value as "h2" | "h3")}
                          className="h-9 w-20 rounded-lg border border-slate-100 bg-white px-2 text-sm font-semibold text-slate-700"
                        >
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                        </select>
                        <Input
                          value={section.heading}
                          onChange={(e) => updateSeoSectionHeading(sectionIndex, e.target.value)}
                          placeholder={section.heading_level === "h3" ? "Use Cases:" : "We Provide Affordable..."}
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
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-600">Bullet points</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addSeoBullet(sectionIndex, false)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                        <button
                          type="button"
                          onClick={() => addSeoBullet(sectionIndex, true)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" /> Text Only
                        </button>
                      </div>
                    </div>
                    {section.bullets.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-1 gap-1.5">
                          {bullet.plain ? (
                            <Input
                              value={bullet.text}
                              onChange={(e) => updateSeoBullet(sectionIndex, bulletIndex, "text", e.target.value)}
                              placeholder=""
                              className="h-8 bg-white border-slate-100 text-sm"
                            />
                          ) : (
                            <>
                              <Input
                                value={bullet.label}
                                onChange={(e) => updateSeoBullet(sectionIndex, bulletIndex, "label", e.target.value)}
                                placeholder="Label"
                                className="h-8 bg-white border-slate-100 text-sm"
                              />
                              <Input
                                value={bullet.text}
                                onChange={(e) => updateSeoBullet(sectionIndex, bulletIndex, "text", e.target.value)}
                                placeholder="Description"
                                className="h-8 bg-white border-slate-100 text-sm"
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
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 mt-4">
              <p className="text-sm font-bold text-slate-800">CTA</p>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Main Text</label>
                <Input
                  value={seoContent.main_text}
                  onChange={(e) => updateSeoField("main_text", e.target.value)}
                  placeholder="Stay Fit Today with Upleex Rentals."
                  className="h-9 bg-slate-50 border-slate-100 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Sub Text</label>
                <textarea
                  value={seoContent.sub_text}
                  onChange={(e) => updateSeoField("sub_text", e.target.value)}
                  placeholder="Find fitness gear near you and start your journey now."
                  rows={2}
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
