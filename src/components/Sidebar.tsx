"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  LogOut,
  Receipt,
  ArrowLeftRight,
  Warehouse,
  ClipboardList,
  PackageOpen,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Orders",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/dashboard/inventory", label: "SKUs", icon: Package },
      { href: "/dashboard/inventory/fees", label: "Fees", icon: Receipt },
      { href: "/dashboard/inventory/stock", label: "Stock", icon: ArrowLeftRight },
      { href: "/dashboard/inventory/warehouse", label: "Warehouse", icon: Warehouse },
      { href: "/dashboard/inventory/warehouse/po", label: "Purchase Orders", icon: ClipboardList },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/finance", label: "Finance", icon: DollarSign },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  function closeMobile() {
    setMobileOpen(false);
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <PackageOpen size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--sidebar-text-active)] leading-tight">TSR App</h1>
            <p className="text-[11px] text-[var(--sidebar-text)] leading-tight">Business Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1.5 text-[11px] font-semibold text-[var(--sidebar-text)] uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--transition-fast)] ${
                      isActive
                        ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)] border-l-2 border-[var(--sidebar-active-border)]"
                        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Theme toggle + Logout */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] text-[var(--sidebar-text)] uppercase tracking-wider font-semibold">Settings</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--sidebar-text)] hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-[var(--transition-fast)]"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-0 left-0 z-40 p-4 text-[var(--foreground)]"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar-bg)] flex flex-col transform transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)]"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[var(--sidebar-bg)] flex-col">
        {navContent}
      </aside>
    </>
  );
}
