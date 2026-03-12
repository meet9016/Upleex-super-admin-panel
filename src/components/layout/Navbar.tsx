"use client";

import React, { useEffect, useState } from "react";
import { Bell, Search, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfileDropdown } from "@/components/ui/UserProfileDropdown";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser?.admin?.name || parsedUser?.name || "");
      setUserEmail(parsedUser?.admin?.email || parsedUser?.email || "");
    }
  }, []);
  
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-white/80 px-4 backdrop-blur-md lg:px-8 border-slate-100">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 lg:hidden text-slate-600 hover:bg-slate-50"
        onClick={onMenuClick}
      >
        <Menu size={20} />
      </Button>

      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <div className="hidden w-full max-w-sm lg:flex">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Search dashboards, users, reports..."
              className="pl-10 h-10 bg-slate-50 border-transparent focus:bg-white focus:border-primary/20 transition-all rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-600 hidden md:flex hover:bg-slate-50 rounded-xl">
          <Globe size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:bg-slate-50 rounded-xl">
          <Bell size={20} />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
        </Button>
        
        <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>

        <UserProfileDropdown userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
