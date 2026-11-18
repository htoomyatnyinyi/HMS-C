import React from "react";
import {
  Users,
  Calendar,
  Stethoscope,
  Pill,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { NavTab } from "./Sidebar";

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
  { id: "pharmacy", label: "Rx", icon: Pill },
];

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-t border-slate-200 flex md:hidden items-center justify-around z-30 px-1 safe-area-pb">
      {mobileItems.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-all",
              isActive
                ? "text-blue-600"
                : "text-slate-400 active:text-slate-600 active:bg-slate-50",
            )}
          >
            <div
              className={cn(
                "p-1 rounded-lg transition-all",
                isActive && "bg-blue-50",
              )}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span
              className={cn(
                "text-[10px] mt-0.5 transition-colors",
                isActive ? "font-bold" : "font-medium",
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
