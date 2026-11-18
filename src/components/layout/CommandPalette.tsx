import React, { useEffect } from "react";
import { Command } from "cmdk";
import {
  Search,
  Users,
  Calendar,
  Stethoscope,
  Bed,
  Pill,
  FlaskConical,
  CreditCard,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight
} from "lucide-react";
import type { NavTab } from "./Sidebar";
import { useGetPatientsQuery } from "../../features/patients/patientsApi";
import { useGetMedicinesQuery } from "../../features/pharmacy/pharmacyApi";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: NavTab) => void;
  onSelectPatient?: (patient: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onNavigate,
  onSelectPatient,
}) => {
  const { data: patientsData } = useGetPatientsQuery({ limit: 20 });
  const { data: medicinesData } = useGetMedicinesQuery({ search: "" });

  const patients = patientsData?.data?.data || [];
  const medicines = medicinesData?.data || [];

  // Toggle on ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden shadow-slate-900/20">
        <Command className="w-full">
          <div className="flex items-center px-4 border-b border-slate-100">
            <Search size={18} className="text-slate-400 shrink-0 mr-3" />
            <Command.Input
              placeholder="Search patients by MRN/name, medications, or jump to module..."
              className="w-full py-4 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
              autoFocus
            />
            <kbd className="hidden sm:inline-block text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-2 text-xs">
            <Command.Empty className="p-6 text-center text-slate-400">
              No clinical records or commands matching your search.
            </Command.Empty>

            {/* Quick Navigation Group */}
            <Command.Group heading="Navigation & Clinical Modules" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              {[
                { tab: "dashboard" as NavTab, label: "Overview Dashboard", icon: LayoutDashboard },
                { tab: "patients" as NavTab, label: "Patient Directory (EHR)", icon: Users },
                { tab: "appointments" as NavTab, label: "Appointments & Queue", icon: Calendar },
                { tab: "encounters" as NavTab, label: "Doctor Consultations", icon: Stethoscope },
                { tab: "admissions" as NavTab, label: "Inpatient Wards & Beds", icon: Bed },
                { tab: "pharmacy" as NavTab, label: "Pharmacy Stock & Dispensary", icon: Pill },
                { tab: "laboratory" as NavTab, label: "Diagnostic Lab Orders", icon: FlaskConical },
                { tab: "billing" as NavTab, label: "Billing & Cashier Folios", icon: CreditCard },
                { tab: "admin" as NavTab, label: "System Administration", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.tab}
                    onSelect={() => {
                      onNavigate(item.tab);
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-100 group-hover:bg-blue-100 rounded-lg text-slate-500 group-hover:text-blue-600">
                        <Icon size={15} />
                      </div>
                      <span className="font-semibold text-xs">{item.label}</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Recent Patients */}
            {patients.length > 0 && (
              <Command.Group heading="Patients (Electronic Health Records)" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 pt-2 border-t border-slate-100">
                {patients.slice(0, 5).map((p) => (
                  <Command.Item
                    key={p.id}
                    onSelect={() => {
                      onNavigate("patients");
                      onSelectPatient?.(p);
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-800 group-hover:text-blue-700">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          MRN: {p.mrn} &bull; Gender: {p.gender} &bull; Blood: {p.bloodGroup || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 group-hover:bg-blue-100 text-slate-600 px-2 py-0.5 rounded">
                      Open EHR
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Formularies / Medicines */}
            {medicines.length > 0 && (
              <Command.Group heading="Pharmacy Formulary" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 pt-2 border-t border-slate-100">
                {medicines.slice(0, 4).map((m) => (
                  <Command.Item
                    key={m.id}
                    onSelect={() => {
                      onNavigate("pharmacy");
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Pill size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-800 group-hover:text-purple-700">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {m.genericName || "Standard"} &bull; {m.dosageForm || "Tablet"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {m.code}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Navigation: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd> to select</span>
            <span>Open action: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ENTER</kbd></span>
          </div>
        </Command>
      </div>
    </div>
  );
};
