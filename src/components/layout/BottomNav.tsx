import React from "react";
import {
  Users,
  Calendar,
  Stethoscope,
  Pill,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { NavTab } from "./Sidebar";
import { useAppSelector } from "../../app/hooks";

interface MobileNavItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
}

const mobileItems: MobileNavItem[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "appointments", label: "Appts", icon: Calendar },
  { id: "encounters", label: "Clinic", icon: Stethoscope },
  { id: "pharmacy", label: "Pharmacy", icon: Pill },
];

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
}) => {
  const roles = useAppSelector((state) => state.auth.user?.roles || []);
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  const items = isAdmin
    ? [...mobileItems.slice(0, 4), { id: "admin" as NavTab, label: "Admin", icon: ShieldCheck }]
    : mobileItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex md:hidden items-center justify-around z-30 px-2 safe-area-pb shadow-lg shadow-slate-900/5">
      {items.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative",
              isActive
                ? "text-blue-600"
                : "text-slate-400 active:text-slate-700"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-2xs"
                  : "text-slate-400"
              )}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span
              className={cn(
                "text-[10px] tracking-tight transition-colors mt-0.5",
                isActive ? "font-bold text-blue-600" : "font-medium text-slate-500"
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
