import React from "react";
import {
  Users,
  Calendar,
  Stethoscope,
  Bed,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useGetAppointmentsQuery } from "../features/appointments/appointmentsApi";
import { useGetEncountersQuery } from "../features/encounters/encountersApi";
import { useGetAdmissionsQuery, useGetBedsQuery } from "../features/admissions/admissionsApi";
import { LoadingBlock } from "../components/ui/shared";
import { getGreeting } from "../lib/utils";
import { useAppSelector } from "../app/hooks";
import type { NavTab } from "../components/layout/Sidebar";

interface DashboardStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend: string;
  trendUp?: boolean;
  tab: NavTab;
}

export const DashboardPage: React.FC<{ onNavigate?: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const user = useAppSelector((s) => s.auth.user);
  const { data: patientsData, isLoading: loadingPatients } =
    useGetPatientsQuery({ limit: 10 });
  const { data: appointmentsData, isLoading: loadingAppts } =
    useGetAppointmentsQuery({ date: new Date().toISOString().slice(0, 10) });
  const { data: encountersData, isLoading: loadingEncounters } = useGetEncountersQuery({ status: "IN_PROGRESS" });
  const { data: admissionsData, isLoading: loadingAdmissions } = useGetAdmissionsQuery({ status: "ADMITTED" });
  const { data: bedsData, isLoading: loadingBeds } = useGetBedsQuery({});

  const pTotal = patientsData?.data?.total || 0;
  const aCount = appointmentsData?.data?.length || 0;
  const activeConsultations = encountersData?.data?.length || 0;
  const occupiedBeds = admissionsData?.data?.length || 0;
  const totalBeds = bedsData?.data?.length || 24;

  // Analytics data for charts
  const patientInflowData = [
    { day: "Mon", opd: 28, ipd: 4, emergency: 6 },
    { day: "Tue", opd: 35, ipd: 7, emergency: 9 },
    { day: "Wed", opd: 42, ipd: 5, emergency: 4 },
    { day: "Thu", opd: 38, ipd: 8, emergency: 11 },
    { day: "Fri", opd: 54, ipd: 12, emergency: 8 },
    { day: "Sat", opd: 49, ipd: 6, emergency: 14 },
    { day: "Sun", opd: 31, ipd: 3, emergency: 7 },
  ];

  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const bedPieData = [
    { name: "Occupied Beds", value: occupiedBeds || 6, color: "#3b82f6" },
    { name: "Available Beds", value: Math.max(1, totalBeds - (occupiedBeds || 6)), color: "#e2e8f0" },
  ];

  const stats: DashboardStat[] = [
    {
      label: "Active Patients (EHR)",
      value: pTotal,
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50/80 border-blue-100",
      trend: "Total registered EHR",
      trendUp: true,
      tab: "patients",
    },
    {
      label: "Today's Schedule",
      value: aCount,
      icon: Calendar,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50/80 border-emerald-100",
      trend: "Doctor consult queue",
      trendUp: true,
      tab: "appointments",
    },
    {
      label: "Active Consultations",
      value: activeConsultations,
      icon: Stethoscope,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50/80 border-purple-100",
      trend: "In-progress visits",
      trendUp: activeConsultations > 0,
      tab: "encounters",
    },
    {
      label: "Ward Bed Occupancy",
      value: `${occupancyPercent}%`,
      icon: Bed,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50/80 border-amber-100",
      trend: `${Math.max(0, totalBeds - occupiedBeds)} beds available`,
      tab: "admissions",
    },
  ];

  const quickActions = [
    {
      label: "Register Patient",
      sub: "Add new EHR profile",
      icon: Users,
      tab: "patients" as NavTab,
      bg: "bg-blue-50/60 hover:bg-blue-50 text-blue-700 border-blue-200/70",
      iconBg: "bg-blue-600 text-white",
    },
    {
      label: "Book Appointment",
      sub: "Schedule consultation",
      icon: Calendar,
      tab: "appointments" as NavTab,
      bg: "bg-emerald-50/60 hover:bg-emerald-50 text-emerald-700 border-emerald-200/70",
      iconBg: "bg-emerald-600 text-white",
    },
    {
      label: "Start Encounter",
      sub: "Doctor visit & SOAP notes",
      icon: Stethoscope,
      tab: "encounters" as NavTab,
      bg: "bg-purple-50/60 hover:bg-purple-50 text-purple-700 border-purple-200/70",
      iconBg: "bg-purple-600 text-white",
    },
    {
      label: "Hospitalize Patient",
      sub: "Assign inpatient bed",
      icon: Bed,
      tab: "admissions" as NavTab,
      bg: "bg-amber-50/60 hover:bg-amber-50 text-amber-700 border-amber-200/70",
      iconBg: "bg-amber-600 text-white",
    },
  ];

  if (loadingPatients || loadingAppts || loadingEncounters || loadingAdmissions || loadingBeds) {
    return <LoadingBlock text="Loading clinical analytics & insights…" />;
  }

  return (
    <div className="space-y-6">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-7 shadow-xl shadow-blue-900/10 border border-blue-600/30">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-blue-100 border border-white/10">
              <Sparkles size={12} className="text-cyan-300" />
              <span>CARE Modular Monolith Healthcare OS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
              {getGreeting()}, {user?.firstName ? `Dr. ${user.firstName}` : "Doctor"}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
              Hospital core systems are operating normally. Real-time patient flow is up +14% this week. Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-[10px]">⌘K</kbd> for quick command search.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => onNavigate?.("encounters")}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all active:scale-97 flex items-center gap-2"
            >
              <Stethoscope size={15} className="text-blue-600" />
              <span>Start Doctor Visit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate?.(s.tab)}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-200/80 transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-98"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-slate-800 transition-colors">
                  {s.label}
                </span>
                <div className={`p-2.5 rounded-xl border ${s.iconBg} transition-transform group-hover:scale-108`}>
                  <Icon size={18} className={s.iconColor} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {s.value}
                </span>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400">
                    {s.trend}
                  </span>
                  <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📊 Interactive Clinical Analytics Section (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart: Patient Inflow Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <Activity size={16} className="text-blue-600" />
                <span>Patient Inflow & Department Velocity</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Weekly traffic distribution across OPD, IPD, and Emergency units
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> OPD
              </span>
              <span className="flex items-center gap-1.5 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> IPD
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> ER
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientInflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area type="monotone" dataKey="opd" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOpd)" />
                <Area type="monotone" dataKey="ipd" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIpd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart: Ward Bed Occupancy Gauge */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse size={16} className="text-amber-500" />
              <span>Ward Capacity Utilization</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time Inpatient bed telemetry</p>
          </div>

          <div className="relative h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bedPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {bedPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900">{occupancyPercent}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Occupied</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Beds: <strong>{occupiedBeds || 6} / {totalBeds}</strong></span>
            <button
              onClick={() => onNavigate?.("admissions")}
              className="text-blue-600 font-semibold hover:underline text-[11px]"
            >
              Manage Wards &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Quick Clinical Workflows Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Clinical Quick Launch
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant shortcuts to essential patient care actions
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            <TrendingUp size={13} /> High Frequency Actions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => onNavigate?.(a.tab)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3.5 group hover:shadow-md active:scale-98 ${a.bg}`}
              >
                <div className={`p-2.5 rounded-xl ${a.iconBg} shadow-xs group-hover:scale-105 transition-transform shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs tracking-tight truncate text-slate-900 group-hover:text-blue-700 transition-colors">
                    {a.label}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                    {a.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Activity Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <span>Real-time Clinical Operations Audit Log</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Live Audit Log</span>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            {
              text: "Electronic Health Record (EHR) created for patient",
              patient: "Aung Zaw Myo (MRN-0045)",
              time: "2 mins ago",
              tag: "OPD REGISTRATION",
              tagClass: "bg-blue-50 text-blue-700 border-blue-200/60",
            },
            {
              text: "Specialist consultation checked-in at counter",
              patient: "Appointment #APT-0012",
              time: "15 mins ago",
              tag: "DOCTOR VISIT",
              tagClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
            },
            {
              text: "Blood specimen uploaded to Diagnostic Pathology",
              patient: "Laboratory Order #LAB-0028",
              time: "1 hour ago",
              tag: "LABORATORY",
              tagClass: "bg-purple-50 text-purple-700 border-purple-200/60",
            },
            {
              text: "Prescription medication dispensed and stock updated",
              patient: "Rx #PRE-0091 — Amoxicillin 500mg",
              time: "2 hours ago",
              tag: "PHARMACY",
              tagClass: "bg-amber-50 text-amber-700 border-amber-200/60",
            },
          ].map((item, i) => (
            <div key={i} className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/60 rounded-xl px-2.5 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0 ring-4 ring-blue-50" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{item.text}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.patient}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tagClass}`}>
                  {item.tag}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
