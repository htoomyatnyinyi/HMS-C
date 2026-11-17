import React from "react";
import { Users, Calendar, Stethoscope, Bed } from "lucide-react";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useGetAppointmentsQuery } from "../features/appointments/appointmentsApi";

export const DashboardPage: React.FC = () => {
  const { data: patientsData } = useGetPatientsQuery({ limit: 5 });
  const { data: appointmentsData } = useGetAppointmentsQuery({});

  const stats = [
    { label: "Active Patients", value: patientsData?.data?.total || "0", icon: <Users size={20} className="text-blue-600" />, trend: "+12% this week" },
    { label: "Appointments Today", value: appointmentsData?.data?.length || "0", icon: <Calendar size={20} className="text-emerald-600" />, trend: "95% confirmed" },
    { label: "Active Consultations", value: "8", icon: <Stethoscope size={20} className="text-purple-600" />, trend: "Avg 15 mins" },
    { label: "Ward Occupancy", value: "72%", icon: <Bed size={20} className="text-amber-600" />, trend: "18 beds free" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Good Day, Medical Staff</h2>
          <p className="text-xs md:text-sm text-blue-100 mt-1">
            System status: All 11 hospital monolith microservices online and operational.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <div className="p-2 bg-slate-50 rounded-lg">{s.icon}</div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">{s.value}</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Clinical Shortcuts */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800">Quick Clinical Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <Users size={16} /> Register Patient
          </button>
          <button className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <Calendar size={16} /> Book Appt
          </button>
          <button className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <Stethoscope size={16} /> Start Visit
          </button>
          <button className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <Bed size={16} /> Admit Patient
          </button>
        </div>
      </div>
    </div>
  );
};
