import React from "react";
import { Users, Calendar, Stethoscope, Pill, LayoutDashboard } from "lucide-react";
import type { NavTab } from "./Sidebar";

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const mobileItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Home", icon: <LayoutDashboard size={18} /> },
    { id: "patients", label: "Patients", icon: <Users size={18} /> },
    { id: "appointments", label: "Appts", icon: <Calendar size={18} /> },
    { id: "encounters", label: "Clinic", icon: <Stethoscope size={18} /> },
    { id: "pharmacy", label: "Rx", icon: <Pill size={18} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex md:hidden items-center justify-around z-30 shadow-lg px-2">
      {mobileItems.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 ${
              isActive ? "text-blue-600 font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
