import React from "react";
import {
  Users,
  Calendar,
  Stethoscope,
  Bed,
  Pill,
  FlaskConical,
  CreditCard,
  ShieldCheck,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type NavTab =
  | "dashboard"
  | "patients"
  | "appointments"
  | "encounters"
  | "admissions"
  | "pharmacy"
  | "laboratory"
  | "billing"
  | "admin";

interface NavItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "encounters", label: "Consultation", icon: Stethoscope },
  { id: "admissions", label: "Inpatient", icon: Bed },
  { id: "pharmacy", label: "Pharmacy", icon: Pill },
  { id: "laboratory", label: "Lab", icon: FlaskConical },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "admin", label: "Administration", icon: ShieldCheck },
];

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
}) => {
  return (
    <aside className="w-56  hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
      {/* Nav Items */}
      <nav className="p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Info Card */}
      <div className="p-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/40 space-y-1">
          <p className="font-semibold text-[11px] text-slate-200">
            Tauri 2.0 Platform
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Desktop & Mobile — CARE Modular Monolith
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">
              API Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
