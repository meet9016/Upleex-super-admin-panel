"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderPlus,
  Layers,
  Users,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

type MenuItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<any>;
  subItems?: MenuItem[];
};

const menuItems: { group: string; items: MenuItem[] }[] = [
  {
    group: "Analytics",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Management",
    items: [
      { name: "Vendors", href: "/vendors", icon: Users },
      {
        name: "Categories",
        icon: Layers,
        subItems: [
          { name: "Add Category", href: "/categories/add", icon: FolderPlus },
          { name: "Add Sub Category", href: "/categories/sub/add", icon: Layers },
        ],
      },
      {
        name: "Plans",
        icon: FolderPlus,
        subItems: [
          { name: "Product listing Plan", href: "/plans", icon: FolderPlus },
          { name: "Priority Plan", href: "/priority", icon: FolderPlus },
          { name: "Plan Purchases", href: "/plan-purchases", icon: FolderPlus },
        ],
      },
    ],
  },
  {
    group: "Content",
    items: [
      { name: "Blog", href: "/blog", icon: BookOpen },
      { name: "FAQs", href: "/faq", icon: HelpCircle },
    ],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  isCollapsed = false,
  onToggle,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300 ease-in-out shadow-sm",
        isCollapsed ? "w-20" : "w-64",
        isMobile && "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
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
            className={cn(
              "h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50",
              !isCollapsed && "ml-auto"
            )}
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
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = !!item.subItems?.length;
                  const isOpen = openMenus[item.name] ?? false;

                  // Check if this item or any sub-item is active
                  const isActive = item.href ? pathname === item.href : false;
                  const isGroupActive =
                    hasSubItems &&
                    item.subItems?.some((sub) => pathname === sub.href);

                  if (!hasSubItems) {
                    // Regular link item
                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      onClick={isMobile ? onToggle : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                        (isActive || isGroupActive)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        (isCollapsed && !isMobile) && "justify-center px-2"
                      )}
                    >
                      <Icon
                        size={20}
                        className={cn(
                          "transition-colors",
                          (isActive || isGroupActive)
                            ? "text-blue-600"
                            : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      {(!isCollapsed || isMobile) && <span>{item.name}</span>}
                    </Link>
                  );
                  }

                  // Collapsible parent with sub-items
                  return (
                    <div key={item.name}>
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.name)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                          isGroupActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          (isCollapsed && !isMobile) && "justify-center px-2"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            size={20}
                            className={cn(
                              "transition-colors",
                              isGroupActive
                                ? "text-blue-600"
                                : "text-gray-400 group-hover:text-gray-600"
                            )}
                          />
                          {(!isCollapsed || isMobile) && <span>{item.name}</span>}
                        </div>

                        {(!isCollapsed || isMobile) && (
                          isOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )
                        )}
                      </button>

                      {/* Submenu items */}
                      {isOpen && (!isCollapsed || isMobile) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subItems!.map((sub) => {
                            const SubIcon = sub.icon;
                            const subActive = pathname === sub.href;

                            return (
                              <Link
                                key={sub.name}
                                href={sub.href!}
                                onClick={isMobile ? onToggle : undefined}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                                  subActive
                                    ? "bg-blue-50/70 text-blue-700 font-medium"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                )}
                              >
                                <SubIcon
                                  size={18}
                                  className={cn(
                                    subActive ? "text-blue-600" : "text-gray-400"
                                  )}
                                />
                                <span>{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 mt-auto border-t border-gray-100 pt-6 space-y-1">
          <Link
            href="/settings"
            onClick={isMobile ? onToggle : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group",
              (isCollapsed && !isMobile) && "justify-center px-2"
            )}
          >
            <Settings size={20} className="text-gray-400 group-hover:text-gray-600" />
            {(!isCollapsed || isMobile) && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full text-left group",
              (isCollapsed && !isMobile) && "justify-center px-2"
            )}
          >
            <LogOut size={20} className="text-red-400 group-hover:text-red-500" />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
