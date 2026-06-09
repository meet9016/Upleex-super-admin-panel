
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface OfferItem {
  title: string;
  description: string;
}

interface TeamMember {
  initials: string;
  name: string;
  role: string;
  points: string[];
}

interface AboutUsData {
  about: {
    heading: string;
    paragraphs: string[];
  };
  offer: {
    heading: string;
    intro: string;
    items: OfferItem[];
    outro: string;
  };
  team: {
    heading: string;
    members: TeamMember[];
  };
}

const emptyData: AboutUsData = {
  about: {
    heading: "About Upleex",
    paragraphs: [""],
  },
  offer: {
    heading: "What Do We Offer",
    intro: "",
    items: [{ title: "", description: "" }],
    outro: "",
  },
  team: {
    heading: "Meet Our Team",
    members: [{ initials: "", name: "", role: "", points: [""] }],
  },
};

export default function AboutUsDynamicPage() {
  const [data, setData] = useState<AboutUsData>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsFetching(true);
      const res = await api.get(endPointApi.getDynamicPageBySlug.replace(":slug", "about-us"));
      if (res.data?.data?.content) {
        try {
          const parsed = JSON.parse(res.data.data.content);
          if (parsed.about || parsed.offer || parsed.team) {
             setData({
               about: {
                 heading: parsed.about?.heading || (typeof parsed.about === 'object' && !Array.isArray(parsed.about) ? "About Upleex" : "About Upleex"),
                 paragraphs: Array.isArray(parsed.about?.paragraphs) 
                   ? parsed.about.paragraphs 
                   : (Array.isArray(parsed.about) ? parsed.about : emptyData.about.paragraphs),
               },
               offer: {
                 heading: parsed.offer?.heading || "What Do We Offer",
                 intro: parsed.offer?.intro || "",
                 items: Array.isArray(parsed.offer?.items) ? parsed.offer.items : emptyData.offer.items,
                 outro: parsed.offer?.outro || "",
               },
               team: {
                 heading: parsed.team?.heading || "Meet Our Team",
                 members: Array.isArray(parsed.team?.members) 
                   ? parsed.team.members 
                   : (Array.isArray(parsed.team) ? parsed.team : emptyData.team.members),
               },
             });
          }
        } catch(e) {
          console.error("Failed to parse JSON content", e);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load about us content");
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const payload = {
        slug: "about-us",
        title: "About Upleex",
        content: JSON.stringify(data),
      };

      const res = await api.post(endPointApi.upsertDynamicPage, payload);
      if (res.data?.success) {
        toast.success("About Us content saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save content");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for About Section
  const handleAboutHeading = (value: string) => {
    setData({ ...data, about: { ...data.about, heading: value } });
  };
  const handleAboutChange = (index: number, value: string) => {
    const newParagraphs = [...data.about.paragraphs];
    newParagraphs[index] = value;
    setData({ ...data, about: { ...data.about, paragraphs: newParagraphs } });
  };
  const addAboutParagraph = () => setData({ ...data, about: { ...data.about, paragraphs: [...data.about.paragraphs, ""] } });
  const removeAboutParagraph = (index: number) => {
    if (data.about.paragraphs.length === 1) return;
    setData({ ...data, about: { ...data.about, paragraphs: data.about.paragraphs.filter((_, i) => i !== index) } });
  };

  // Handlers for Offer Section
  const handleOfferHeading = (value: string) => {
    setData({ ...data, offer: { ...data.offer, heading: value } });
  };
  const handleOfferIntroOutro = (field: "intro" | "outro", value: string) => {
    setData({ ...data, offer: { ...data.offer, [field]: value } });
  };
  const handleOfferItemChange = (index: number, field: keyof OfferItem, value: string) => {
    const newItems = [...data.offer.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, offer: { ...data.offer, items: newItems } });
  };
  const addOfferItem = () => setData({ ...data, offer: { ...data.offer, items: [...data.offer.items, { title: "", description: "" }] } });
  const removeOfferItem = (index: number) => {
    if (data.offer.items.length === 1) return;
    setData({ ...data, offer: { ...data.offer, items: data.offer.items.filter((_, i) => i !== index) } });
  };

  // Handlers for Team Section
  const handleTeamHeading = (value: string) => {
    setData({ ...data, team: { ...data.team, heading: value } });
  };
  const handleTeamChange = (teamIndex: number, field: keyof Omit<TeamMember, "points">, value: string) => {
    const newMembers = [...data.team.members];
    newMembers[teamIndex] = { ...newMembers[teamIndex], [field]: value };
    setData({ ...data, team: { ...data.team, members: newMembers } });
  };
  const addTeamMember = () => setData({ ...data, team: { ...data.team, members: [...data.team.members, { initials: "", name: "", role: "", points: [""] }] } });
  const removeTeamMember = (index: number) => {
    if (data.team.members.length === 1) return;
    setData({ ...data, team: { ...data.team, members: data.team.members.filter((_, i) => i !== index) } });
  };
  const handleTeamPointChange = (teamIndex: number, pointIndex: number, value: string) => {
    const newMembers = [...data.team.members];
    const newPoints = [...newMembers[teamIndex].points];
    newPoints[pointIndex] = value;
    newMembers[teamIndex].points = newPoints;
    setData({ ...data, team: { ...data.team, members: newMembers } });
  };
  const addTeamPoint = (teamIndex: number) => {
    const newMembers = [...data.team.members];
    newMembers[teamIndex].points.push("");
    setData({ ...data, team: { ...data.team, members: newMembers } });
  };
  const removeTeamPoint = (teamIndex: number, pointIndex: number) => {
    const newMembers = [...data.team.members];
    if (newMembers[teamIndex].points.length === 1) return;
    newMembers[teamIndex].points = newMembers[teamIndex].points.filter((_, i) => i !== pointIndex);
    setData({ ...data, team: { ...data.team, members: newMembers } });
  };

  const textareaClass = "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">About Us Content</h2>
          <p className="text-sm text-slate-500 mt-1">Manage the content that appears on the user panel About Us page.</p>
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
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">About Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Section Heading</label>
                <Input value={data.about.heading} onChange={(e) => handleAboutHeading(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Paragraphs</label>
                {data.about.paragraphs.map((p, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea className={textareaClass} value={p} onChange={(e) => handleAboutChange(index, e.target.value)} />
                    {data.about.paragraphs.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeAboutParagraph(index)} className="text-red-500 shrink-0 h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAboutParagraph}><Plus className="mr-2 h-4 w-4" /> Add Paragraph</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Offer Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Section Heading</label>
                <Input value={data.offer.heading} onChange={(e) => handleOfferHeading(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Intro Text</label>
                  <textarea className={textareaClass} value={data.offer.intro} onChange={(e) => handleOfferIntroOutro("intro", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Outro Text</label>
                  <textarea className={textareaClass} value={data.offer.outro} onChange={(e) => handleOfferIntroOutro("outro", e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Offer Items</label>
                {data.offer.items.map((item, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 relative">
                    <div className="absolute right-2 top-2">
                      {data.offer.items.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeOfferItem(index)} className="text-red-500 h-6 w-6 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input placeholder="Title" value={item.title} onChange={(e) => handleOfferItemChange(index, "title", e.target.value)} className="w-[90%]" />
                    <textarea className={textareaClass} placeholder="Description" value={item.description} onChange={(e) => handleOfferItemChange(index, "description", e.target.value)} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOfferItem}><Plus className="mr-2 h-4 w-4" /> Add Offer Item</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4">
              <CardTitle className="text-lg">Team Section</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Section Heading</label>
                <Input value={data.team.heading} onChange={(e) => handleTeamHeading(e.target.value)} />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Team Members</label>
                {data.team.members.map((member, teamIndex) => (
                  <div key={teamIndex} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3 relative">
                    <div className="absolute right-2 top-2">
                      {data.team.members.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeTeamMember(teamIndex)} className="text-red-500 h-6 w-6 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-[90%]">
                      <Input placeholder="Initials" value={member.initials} onChange={(e) => handleTeamChange(teamIndex, "initials", e.target.value)} />
                      <Input placeholder="Name" value={member.name} onChange={(e) => handleTeamChange(teamIndex, "name", e.target.value)} />
                      <Input placeholder="Role" value={member.role} onChange={(e) => handleTeamChange(teamIndex, "role", e.target.value)} />
                    </div>
                    <div className="space-y-2 mt-2">
                      <label className="text-xs font-medium">Bullet Points</label>
                      {member.points.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex gap-2">
                          <Input value={point} onChange={(e) => handleTeamPointChange(teamIndex, pointIndex, e.target.value)} />
                          {member.points.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeTeamPoint(teamIndex, pointIndex)} className="text-red-500 shrink-0 h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addTeamPoint(teamIndex)} className="mt-1 h-7"><Plus className="mr-1 h-3 w-3" /> Add Point</Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addTeamMember}><Plus className="mr-2 h-4 w-4" /> Add Team Member</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
