"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderPlus, 
  Layers, 
  BookOpen, 
  HelpCircle, 
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

const menuItems = [
  { group: "Analytics", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ]},
  { group: "Management", items: [
    { name: "Add Category", href: "/categories/add", icon: FolderPlus },
    { name: "Add Sub Category", href: "/categories/sub/add", icon: Layers },
  ]},
  { group: "Content", items: [
    { name: "Blog", href: "/blog", icon: BookOpen },
    { name: "FAQs", href: "/faq", icon: HelpCircle },
  ]},
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isCollapsed = false, onToggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300 ease-in-out shadow-sm",
        isCollapsed ? "w-20" : "w-64",
        isMobile && "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b">
        {(!isCollapsed || isMobile) && (
  <div className="flex items-center gap-2">
    <Image
      src="/logo.png"
      alt="Upleex Logo"
      width={120}
      height={40}
      priority
      className="object-contain"
    />
  </div>
)}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-8 w-8 text-muted-foreground", !isCollapsed && "ml-auto")}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        )}
      </div>

      <div className="flex flex-col h-[calc(100vh-64px)] justify-between py-6">
        <nav className="space-y-6 px-4">
          {menuItems.map((group) => (
            <div key={group.group} className="space-y-2">
              {(!isCollapsed || isMobile) && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={isMobile ? onToggle : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "text-slate-600 hover:bg-slate-50 hover:text-primary",
                        isCollapsed && !isMobile && "justify-center px-2"
                      )}
                    >
                      <Icon size={20} className={cn(
                        "transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                      )} />
                      {(!isCollapsed || isMobile) && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 mt-auto border-t pt-6 space-y-1">
          <Link
            href="/settings"
            onClick={isMobile ? onToggle : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
          >
            <Settings size={20} className="text-slate-400 group-hover:text-primary" />
            {(!isCollapsed || isMobile) && <span>Settings</span>}
          </Link>
          <button
            onClick={isMobile ? onToggle : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all w-full text-left group",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
          >
            <LogOut size={20} className="text-red-400 group-hover:text-red-600" />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
