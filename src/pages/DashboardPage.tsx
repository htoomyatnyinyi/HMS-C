import React from "react";
import {
  Users,
  Calendar,
  Stethoscope,
  Bed,
  ArrowUpRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useGetAppointmentsQuery } from "../features/appointments/appointmentsApi";
import { useGetEncountersQuery } from "../features/encounters/encountersApi";
import { useGetAdmissionsQuery, useGetBedsQuery } from "../features/admissions/admissionsApi";
import { LoadingBlock } from "../components/ui/shared";
import { getGreeting } from "../lib/utils";
import { useAppSelector } from "../app/hooks";
import type { NavTab } from "../components/layout/Sidebar";

interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend: string;
  trendUp?: boolean;
}

export const DashboardPage: React.FC<{ onNavigate?: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const user = useAppSelector((s) => s.auth.user);
  const { data: patientsData, isLoading: loadingPatients } =
    useGetPatientsQuery({ limit: 5 });
  const { data: appointmentsData, isLoading: loadingAppts } =
    useGetAppointmentsQuery({ date: new Date().toISOString().slice(0, 10) });
  const { data: encountersData, isLoading: loadingEncounters } = useGetEncountersQuery({ status: "IN_PROGRESS" });
  const { data: admissionsData, isLoading: loadingAdmissions } = useGetAdmissionsQuery({ status: "ADMITTED" });
  const { data: bedsData, isLoading: loadingBeds } = useGetBedsQuery({});

  const pTotal = patientsData?.data?.total || 0;
  const aCount = appointmentsData?.data?.length || 0;
  const activeConsultations = encountersData?.data?.length || 0;
  const occupiedBeds = admissionsData?.data?.length || 0;
  const totalBeds = bedsData?.data?.length || 0;

  const stats: StatCard[] = [
    {
      label: "Active Patients",
      value: pTotal,
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      trend: "+12% this week",
      trendUp: true,
    },
    {
      label: "Today's Appointments",
      value: aCount,
      icon: Calendar,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      trend: "95% confirmed",
      trendUp: true,
    },
    {
      label: "Active Consultations",
      value: activeConsultations,
      icon: Stethoscope,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      trend: "Avg 15 min",
    },
    {
      label: "Ward Occupancy",
      value: totalBeds ? `${Math.round((occupiedBeds / totalBeds) * 100)}%` : "0%",
      icon: Bed,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      trend: totalBeds ? `${Math.max(0, totalBeds - occupiedBeds)} beds free` : "No beds configured",
    },
  ];

  const quickActions = [
    {
      label: "Register Patient",
      icon: Users,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/60",
    },
    {
      label: "Book Appointment",
      icon: Calendar,
      color:
        "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/60",
    },
    {
      label: "Start Visit",
      icon: Stethoscope,
      color:
        "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/60",
    },
    {
      label: "Admit Patient",
      icon: Bed,
      color:
        "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/60",
    },
  ];

  if (loadingPatients || loadingAppts || loadingEncounters || loadingAdmissions || loadingBeds) {
    return <LoadingBlock text="Loading dashboard…" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/15">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <h2 className="text-lg md:text-xl font-bold">
            {getGreeting()}, {user?.firstName || "Doctor"}
          </h2>
          <p className="text-sm text-blue-100 mt-1 max-w-lg">
            All 11 clinical modules online. {aCount} appointment
            {aCount !== 1 ? "s" : ""} scheduled today, {pTotal} patient
            {pTotal !== 1 ? "s" : ""} in the directory.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 leading-tight">
                  {s.label}
                </span>
                <div className={`p-2 rounded-lg ${s.iconBg}`}>
                  <Icon size={18} className={s.iconColor} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {s.value}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  {s.trendUp && (
                    <ArrowUpRight size={12} className="text-emerald-500" />
                  )}
                  <span className="text-[11px] text-slate-400">{s.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800">
          Quick Clinical Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => onNavigate?.(
                  a.label === "Register Patient" ? "patients" :
                  a.label === "Book Appointment" ? "appointments" :
                  a.label === "Start Visit" ? "encounters" : "admissions",
                )}
                className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border ${a.color}`}
              >
                <Icon size={15} />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800">Recent Activity</h3>
        <div className="space-y-2.5">
          {[
            {
              text: "New patient registered — Aung Zaw Myo (MRN-0045)",
              time: "2 min ago",
              dot: "bg-blue-500",
            },
            {
              text: "Appointment #APT-0012 checked in at OPD",
              time: "15 min ago",
              dot: "bg-emerald-500",
            },
            {
              text: "Lab result uploaded for case ENC-0028",
              time: "1 hr ago",
              dot: "bg-purple-500",
            },
            {
              text: "Prescription dispensed — Metformin 500mg x60",
              time: "2 hrs ago",
              dot: "bg-amber-500",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.dot}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-relaxed">
                  {item.text}
                </p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock size={10} /> {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
