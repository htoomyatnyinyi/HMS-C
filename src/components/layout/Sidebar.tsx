import React from "react";
import {
  Users,
  Calendar,
  Stethoscope,
  Bed,
  Pill,
  FlaskConical,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "patients"
  | "appointments"
  | "encounters"
  | "admissions"
  | "pharmacy"
  | "laboratory"
  | "billing";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const items: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { id: "patients", label: "Patients", icon: <Users size={18} /> },
    { id: "appointments", label: "Appointments", icon: <Calendar size={18} /> },
    { id: "encounters", label: "Consultation", icon: <Stethoscope size={18} /> },
    { id: "admissions", label: "Inpatient Beds", icon: <Bed size={18} /> },
    { id: "pharmacy", label: "Pharmacy & Stock", icon: <Pill size={18} /> },
    { id: "laboratory", label: "Diagnostic Lab", icon: <FlaskConical size={18} /> },
    { id: "billing", label: "Billing & Cashier", icon: <CreditCard size={18} /> },
  ];

  return (
    <aside className="w-56 bg-slate-900 text-slate-300 p-3 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-200">Tauri 2.0 Desktop</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Connected to Care API Monolith</p>
      </div>
    </aside>
  );
};
