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
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAppSelector } from "../../app/hooks";

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

const clinicalItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients EHR", icon: Users },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "encounters", label: "Consultations", icon: Stethoscope },
  { id: "admissions", label: "Inpatient Ward", icon: Bed },
];

const operationsItems: NavItem[] = [
  { id: "pharmacy", label: "Pharmacy Stock", icon: Pill },
  { id: "laboratory", label: "Diagnostic Lab", icon: FlaskConical },
  { id: "billing", label: "Cashier & Billing", icon: CreditCard },
  { id: "admin", label: "System Administration", icon: ShieldCheck },
];

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
}) => {
  const roles = useAppSelector((state) => state.auth.user?.roles || []);
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  const filteredOps = operationsItems.filter(
    (item) => item.id !== "admin" || isAdmin
  );

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1 mb-4">
      <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {title}
      </div>
      {items.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative",
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {/* Active Left Indicator Bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
            )}

            <Icon
              size={17}
              strokeWidth={isActive ? 2.3 : 1.8}
              className={cn(
                "shrink-0 transition-colors",
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-blue-600"
              )}
            />
            <span className="truncate">{item.label}</span>

            {item.badge && (
              <span className="ml-auto text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-60 bg-white/95 backdrop-blur-md border-r border-slate-200/80 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 p-3 z-20">
      {/* Navigation Sections */}
      <nav className="overflow-y-auto space-y-2 pr-1">
        {renderNavGroup("Clinical Care", clinicalItems)}
        {renderNavGroup("Hospital Ops", filteredOps)}
      </nav>

      {/* Modern Clinical Status Widget */}
      <div className="pt-2">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
              <HeartPulse size={15} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-100">Care Monolith</p>
              <p className="text-[10px] text-slate-400">Tauri 2.0 Engine</p>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Database Sync</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              11 Services Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
