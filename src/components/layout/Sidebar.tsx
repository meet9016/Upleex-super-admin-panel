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
  Shield,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { usePermissions } from "@/contexts/PermissionContext";

type MenuItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<any>;
  permission?: string;
  subItems?: MenuItem[];
};

const menuItems: { group: string; items: MenuItem[] }[] = [
  {
    group: "Analytics",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
    ],
  },
  {
    group: "Management",
    items: [
      { name: "Vendors", href: "/vendors", icon: Users, permission: "vendors" },
      { name: "Vendor-products", href: "/vendor-products", icon: FolderPlus, permission: "products" },
      { name: "Vendor-services", href: "/vendor-services", icon: FolderPlus, permission: "products" },
      { name: "Dropdowns", href: "/dropdowns", icon: Layers, permission: "dropdowns" },
      { name: "Quotes", href: "/quotes", icon: FileText, permission: "quotes" },
      {
        name: "Categories",
        icon: Layers,
        permission: "categories",
        subItems: [
          { name: "Add Category", href: "/categories/add", icon: FolderPlus, permission: "categories" },
          { name: "Add Sub Category", href: "/categories/sub/add", icon: Layers, permission: "subcategories" },
          { name: "Service Category", href: "/categories/service/add", icon: FolderPlus, permission: "categories" },
        ],
      },
      {
        name: "Plans",
        href: "/plans",
        icon: FolderPlus,
        permission: "orders",
        // subItems: [
        //   { name: "Product listing Plan", href: "/plans", icon: FolderPlus, permission: "orders" },
        //   { name: "Priority Plan", href: "/priority", icon: FolderPlus, permission: "orders" },
        //   { name: "Plan Purchases", href: "/plan-purchases", icon: FolderPlus, permission: "orders" },
        // ],
      },
      { name: "Admin Permissions", href: "/admin-permissions", icon: Shield, permission: "admin-permissions" },
      { name: "Vendor Wallet", href: "/vendor-wallets", icon: Loader2, permission: "vendor-wallets" },
      { name: "Vendor Payments", href: "/vendor-payments", icon: FileText, permission: "vendor-payments" },
    ],
  },
  {
    group: "Content",
    items: [
      { name: "Blog", href: "/blog", icon: BookOpen, permission: "blogs" },
      { name: "Banners", href: "/banners", icon: Layers, permission: "blogs" },
      { name: "FAQs", href: "/faq", icon: HelpCircle, permission: "faqs" },
      { name: "Contact Us", href: "/contact-us", icon: HelpCircle },
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
  const { hasPermission, loading } = usePermissions();

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_info");
    }
    router.push("/login");
  };

  const shouldShowItem = (item: MenuItem) => {
    // If no permission specified, show the item
    if (!item.permission) return true;
    // Check if user has permission
    return hasPermission(item.permission);
  };

  const shouldShowGroup = (group: { group: string; items: MenuItem[] }) => {
    return group.items.some(item => {
      if (shouldShowItem(item)) return true;
      if (item.subItems) {
        return item.subItems.some(subItem => shouldShowItem(subItem));
      }
      return false;
    });
  };

  // Show skeleton loading state
  if (loading) {
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
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          )}
          {!isMobile && (
            <div className={cn("h-8 w-8 bg-gray-200 rounded animate-pulse", !isCollapsed && "ml-auto")} />
          )}
        </div>

        <div className="flex flex-col h-[calc(100vh-64px)] justify-between py-6">
          <nav className="space-y-6 px-4">
            {/* Skeleton groups */}
            {[1, 2, 3].map((group) => (
              <div key={group} className="space-y-2">
                {(!isCollapsed || isMobile) && (
                  <div className="px-3">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                )}
                <div className="space-y-1">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5",
                        (isCollapsed && !isMobile) && "justify-center"
                      )}
                    >
                      <div className="h-5 w-5 bg-gray-200 rounded animate-pulse shrink-0"></div>
                      {(!isCollapsed || isMobile) && (
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-4 mt-auto border-t border-gray-100 pt-6">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5",
                (isCollapsed && !isMobile) && "justify-center"
              )}
            >
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse shrink-0"></div>
              {(!isCollapsed || isMobile) && (
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </aside>
    );
  }

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
              "h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all",
              !isCollapsed && "ml-auto"
            )}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        )}
      </div>

      <div className="flex flex-col h-[calc(100vh-64px)] justify-between py-6">
        <nav className="space-y-6 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
          {menuItems.filter(shouldShowGroup).map((group) => (
            <div key={group.group} className="space-y-2">
              {(!isCollapsed || isMobile) && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.filter(item => {
                  if (shouldShowItem(item)) return true;
                  if (item.subItems) {
                    return item.subItems.some(subItem => shouldShowItem(subItem));
                  }
                  return false;
                }).map((item) => {
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
                            "transition-colors shrink-0",
                            (isActive || isGroupActive)
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        {(!isCollapsed || isMobile) && <span className="truncate">{item.name}</span>}
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
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            size={20}
                            className={cn(
                              "transition-colors shrink-0",
                              isGroupActive
                                ? "text-blue-600"
                                : "text-gray-400 group-hover:text-gray-600"
                            )}
                          />
                          {(!isCollapsed || isMobile) && <span className="truncate">{item.name}</span>}
                        </div>

                        {(!isCollapsed || isMobile) && (
                          <ChevronDown
                            size={16}
                            className={cn(
                              "shrink-0 transition-transform duration-200",
                              isOpen ? "rotate-0" : "-rotate-90"
                            )}
                          />
                        )}
                      </button>

                      {/* Submenu items */}
                      {isOpen && (!isCollapsed || isMobile) && (
                        <div className="ml-8 mt-1 space-y-1 overflow-hidden animate-in slide-in-from-top-1 duration-200">
                          {item.subItems!.filter(shouldShowItem).map((sub) => {
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
                                    "shrink-0",
                                    subActive ? "text-blue-600" : "text-gray-400"
                                  )}
                                />
                                <span className="truncate">{sub.name}</span>
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
          {hasPermission('admin-permissions') && (
            <Link
              href="/settings"
              onClick={isMobile ? onToggle : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group",
                (isCollapsed && !isMobile) && "justify-center px-2"
              )}
            >
              <Settings size={20} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
              {(!isCollapsed || isMobile) && <span className="truncate">Settings</span>}
            </Link>
          )}
          {/* <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full text-left group",
              (isCollapsed && !isMobile) && "justify-center px-2"
            )}
          >
            <LogOut size={20} className="text-red-400 group-hover:text-red-500 shrink-0" />
            {(!isCollapsed || isMobile) && <span className="truncate">Logout</span>}
          </button> */}
        </div>
      </div>
    </aside>
  );
}