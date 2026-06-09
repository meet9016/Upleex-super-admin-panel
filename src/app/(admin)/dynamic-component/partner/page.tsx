"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface StatItem {
  number: string;
  label: string;
}

interface BenefitCard {
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
}

interface HowItWorksStep {
  title: string;
  desc: string;
  items: string[];
}

interface PartnerData {
  hero: {
    heading: string;
    subheading: string;
    buttonText: string;
  };
  stats: StatItem[];
  benefits: {
    heading: string;
    subheading: string;
    cards: BenefitCard[];
  };
  testimonials: {
    heading: string;
    items: Testimonial[];
  };
  howItWorks: {
    heading: string;
    steps: HowItWorksStep[];
  };
  categories: {
    heading: string;
    items: string[];
  };
  support: {
    heading: string;
    description: string;
    email: string;
  };
}

const emptyData: PartnerData = {
  hero: {
    heading: "",
    subheading: "",
    buttonText: "",
  },
  stats: [
    { number: "", label: "" },
  ],
  benefits: {
    heading: "",
    subheading: "",
    cards: [
      { title: "", description: "" },
    ]
  },
  testimonials: {
    heading: "",
    items: [
      { name: "", role: "", text: "" },
    ]
  },
  howItWorks: {
    heading: "",
    steps: [
      { title: "", desc: "", items: [] },
    ]
  },
  categories: {
    heading: "",
    items: [""],
  },
  support: {
    heading: "",
    description: "",
    email: "",
  }
};

export default function PartnerDynamicPage() {
  const [data, setData] = useState<PartnerData>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(endPointApi.getDynamicPageBySlug.replace(":slug", "partner"));
      if (res.data?.data?.content) {
        try {
          const parsed = JSON.parse(res.data.data.content);
          if (parsed.hero || parsed.stats || parsed.benefits) {
             setData({
               hero: parsed.hero || emptyData.hero,
               stats: Array.isArray(parsed.stats) ? parsed.stats : emptyData.stats,
               benefits: parsed.benefits || emptyData.benefits,
               testimonials: parsed.testimonials || emptyData.testimonials,
               howItWorks: parsed.howItWorks || emptyData.howItWorks,
               categories: parsed.categories || emptyData.categories,
               support: parsed.support || emptyData.support,
             });
          }
        } catch(e) {
          console.error("Failed to parse JSON content", e);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load partner content");
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const payload = {
        slug: "partner",
        title: "Partner Page",
        content: JSON.stringify(data),
      };

      const res = await api.post(endPointApi.upsertDynamicPage, payload);
      if (res.data?.success) {
        toast.success("Partner content saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeroChange = (field: keyof PartnerData["hero"], value: string) => {
    setData({ ...data, hero: { ...data.hero, [field]: value } });
  };

  const handleStatChange = (index: number, field: keyof StatItem, value: string) => {
    const newStats = [...data.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setData({ ...data, stats: newStats });
  };
  const addStat = () => setData({ ...data, stats: [...data.stats, { number: "", label: "" }] });
  const removeStat = (index: number) => {
    setData({ ...data, stats: data.stats.filter((_, i) => i !== index) });
  };

  const handleBenefitsChange = (field: "heading" | "subheading", value: string) => {
    setData({ ...data, benefits: { ...data.benefits, [field]: value } });
  };
  const handleBenefitCardChange = (index: number, field: keyof BenefitCard, value: string) => {
    const newCards = [...data.benefits.cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setData({ ...data, benefits: { ...data.benefits, cards: newCards } });
  };
  const addBenefitCard = () => {
    setData({ ...data, benefits: { ...data.benefits, cards: [...data.benefits.cards, { title: "", description: "" }] } });
  };
  const removeBenefitCard = (index: number) => {
    setData({ ...data, benefits: { ...data.benefits, cards: data.benefits.cards.filter((_, i) => i !== index) } });
  };

  const handleTestimonialChange = (index: number, field: keyof Testimonial, value: string) => {
    const newItems = [...data.testimonials.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, testimonials: { ...data.testimonials, items: newItems } });
  };
  const addTestimonial = () => setData({ ...data, testimonials: { ...data.testimonials, items: [...data.testimonials.items, { name: "", role: "", text: "" }] } });
  const removeTestimonial = (index: number) => {
    setData({ ...data, testimonials: { ...data.testimonials, items: data.testimonials.items.filter((_, i) => i !== index) } });
  };

  const handleHowItWorksChange = (index: number, field: keyof HowItWorksStep, value: string) => {
    const newSteps = [...data.howItWorks.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setData({ ...data, howItWorks: { ...data.howItWorks, steps: newSteps } });
  };
  const handleHowItWorksItemChange = (stepIndex: number, itemIndex: number, value: string) => {
    const newSteps = [...data.howItWorks.steps];
    const newItems = [...newSteps[stepIndex].items];
    newItems[itemIndex] = value;
    newSteps[stepIndex].items = newItems;
    setData({ ...data, howItWorks: { ...data.howItWorks, steps: newSteps } });
  };
  const addHowItWorksItem = (stepIndex: number) => {
    const newSteps = [...data.howItWorks.steps];
    newSteps[stepIndex].items.push("");
    setData({ ...data, howItWorks: { ...data.howItWorks, steps: newSteps } });
  };
  const removeHowItWorksItem = (stepIndex: number, itemIndex: number) => {
    const newSteps = [...data.howItWorks.steps];
    newSteps[stepIndex].items = newSteps[stepIndex].items.filter((_, i) => i !== itemIndex);
    setData({ ...data, howItWorks: { ...data.howItWorks, steps: newSteps } });
  };

  const handleCategoriesHeadingChange = (value: string) => {
    setData({ ...data, categories: { ...data.categories, heading: value } });
  };
  const handleCategoryItemChange = (index: number, value: string) => {
    const newItems = [...data.categories.items];
    newItems[index] = value;
    setData({ ...data, categories: { ...data.categories, items: newItems } });
  };
  const addCategoryItem = () => {
    setData({ ...data, categories: { ...data.categories, items: [...data.categories.items, ""] } });
  };
  const removeCategoryItem = (index: number) => {
    setData({ ...data, categories: { ...data.categories, items: data.categories.items.filter((_, i) => i !== index) } });
  };

  const handleSupportChange = (field: keyof PartnerData["support"], value: string) => {
    setData({ ...data, support: { ...data.support, [field]: value } });
  };

  const textareaClass = "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Partner Content</h2>
          <p className="text-sm text-slate-500 mt-1">Manage the content that appears on the user panel Partner page.</p>
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
        <div className="space-y-4">
          {/* Hero Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Heading</label>
                <textarea
                  className={textareaClass}
                  placeholder="Hero Heading"
                  value={data.hero.heading}
                  onChange={(e) => handleHeroChange("heading", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Subheading</label>
                <textarea
                  className={textareaClass}
                  placeholder="Hero Subheading"
                  value={data.hero.subheading}
                  onChange={(e) => handleHeroChange("subheading", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Button Text</label>
                <Input
                  placeholder="Button Text"
                  value={data.hero.buttonText}
                  onChange={(e) => handleHeroChange("buttonText", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Stats Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {data.stats.map((stat, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Input placeholder="Number (e.g. 2,500+)" value={stat.number} onChange={(e) => handleStatChange(index, "number", e.target.value)} />
                  <Input placeholder="Label (e.g. Active Partners)" value={stat.label} onChange={(e) => handleStatChange(index, "label", e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => removeStat(index)} className="text-red-500 shrink-0 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStat}><Plus className="mr-2 h-4 w-4" /> Add Stat</Button>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Benefits Section (Icons are fixed)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Heading</label>
                  <Input value={data.benefits.heading} onChange={(e) => handleBenefitsChange("heading", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Subheading</label>
                  <Input value={data.benefits.subheading} onChange={(e) => handleBenefitsChange("subheading", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.benefits.cards.map((card, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm">Card {index + 1}</h4>
                      {data.benefits.cards.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeBenefitCard(index)} className="text-red-500 h-6 w-6 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input placeholder="Title" value={card.title} onChange={(e) => handleBenefitCardChange(index, "title", e.target.value)} />
                    <textarea className={textareaClass} placeholder="Description" value={card.description} onChange={(e) => handleBenefitCardChange(index, "description", e.target.value)} />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBenefitCard}><Plus className="mr-2 h-4 w-4" /> Add Benefit Card</Button>
            </CardContent>
          </Card>

          {/* Testimonials Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Testimonials Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1 mb-2">
                <label className="text-sm font-medium">Heading</label>
                <Input value={data.testimonials.heading} onChange={(e) => setData({ ...data, testimonials: { ...data.testimonials, heading: e.target.value } })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.testimonials.items.map((item, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 relative">
                    <div className="absolute right-2 top-2">
                      <Button variant="ghost" size="sm" onClick={() => removeTestimonial(index)} className="text-red-500 h-6 w-6 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input placeholder="Name" value={item.name} onChange={(e) => handleTestimonialChange(index, "name", e.target.value)} className="w-[80%]" />
                    <Input placeholder="Role" value={item.role} onChange={(e) => handleTestimonialChange(index, "role", e.target.value)} />
                    <textarea className={textareaClass} placeholder="Testimonial text" value={item.text} onChange={(e) => handleTestimonialChange(index, "text", e.target.value)} />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTestimonial}><Plus className="mr-2 h-4 w-4" /> Add Testimonial</Button>
            </CardContent>
          </Card>

          {/* How It Works Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">How It Works Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1 mb-2">
                <label className="text-sm font-medium">Heading</label>
                <Input value={data.howItWorks.heading} onChange={(e) => setData({ ...data, howItWorks: { ...data.howItWorks, heading: e.target.value } })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.howItWorks.steps.map((step, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                    <h4 className="font-semibold text-sm">Step {index + 1}</h4>
                    <Input placeholder="Title" value={step.title} onChange={(e) => handleHowItWorksChange(index, "title", e.target.value)} />
                    <textarea className={textareaClass} placeholder="Description" value={step.desc} onChange={(e) => handleHowItWorksChange(index, "desc", e.target.value)} />
                    
                    <div className="pt-2">
                      <label className="text-xs font-medium block mb-1">Requirements / Items</label>
                      {step.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex gap-2 mb-2">
                          <Input placeholder="Item (e.g. Business Details)" value={item} onChange={(e) => handleHowItWorksItemChange(index, itemIndex, e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={() => removeHowItWorksItem(index, itemIndex)} className="text-red-500 shrink-0 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addHowItWorksItem(index)} className="mt-1 h-7"><Plus className="mr-1 h-3 w-3" /> Add Item</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Categories Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1 mb-2">
                <label className="text-sm font-medium">Heading</label>
                <Input value={data.categories.heading} onChange={(e) => handleCategoriesHeadingChange(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {data.categories.items.map((item, index) => (
                  <div key={index} className="flex gap-1 items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <Input placeholder="Category Name" value={item} onChange={(e) => handleCategoryItemChange(index, e.target.value)} className="h-8 text-sm" />
                    {data.categories.items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeCategoryItem(index)} className="text-red-500 shrink-0 h-6 w-6">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCategoryItem} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Support Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Heading</label>
                <Input value={data.support.heading} onChange={(e) => handleSupportChange("heading", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <textarea className={textareaClass} value={data.support.description} onChange={(e) => handleSupportChange("description", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email Address</label>
                <Input value={data.support.email} onChange={(e) => handleSupportChange("email", e.target.value)} />
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
