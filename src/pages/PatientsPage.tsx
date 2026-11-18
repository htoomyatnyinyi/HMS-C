import React, { useState } from "react";
import {
  UserPlus,
  RefreshCw,
  Search,
  X,
  Users,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import {
  useGetPatientsQuery,
  useCreatePatientMutation,
  type Patient,
} from "../features/patients/patientsApi";
import { PatientTable } from "../components/patients/PatientTable";
import { PatientDossierDrawer } from "../components/patients/PatientDossierDrawer";
import { LoadingBlock, PageHeader } from "../components/ui/shared";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import type { NavTab } from "../components/layout/Sidebar";

interface PatientsPageProps {
  onNavigate?: (tab: NavTab) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState<string>("ALL");

  const { data, isLoading, refetch } = useGetPatientsQuery({
    page,
    limit: 50,
    search: search || undefined,
  });
  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  /* ─── Form State ─── */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    phone: "",
    email: "",
    dateOfBirth: "",
    bloodGroup: "O_POS",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatient({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        phone: form.phone || undefined,
        email: form.email || undefined,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : undefined,
        bloodGroup: form.bloodGroup,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Patient Registered",
          message: `${form.firstName} ${form.lastName} enrolled in EHR`,
        }),
      );

      setIsModalOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        gender: "MALE",
        phone: "",
        email: "",
        dateOfBirth: "",
        bloodGroup: "O_POS",
      });
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Registration failed";
      dispatch(
        addToast({
          type: "error",
          title: "Registration Failed",
          message: errorMsg || "Failed to register patient",
        }),
      );
    }
  };

  const rawPatientsList = data?.data?.data || [];
  const filteredPatients =
    bloodFilter === "ALL"
      ? rawPatientsList
      : rawPatientsList.filter((p) => p.bloodGroup === bloodFilter);

  const maleCount = rawPatientsList.filter((p) => p.gender === "MALE").length;
  const femaleCount = rawPatientsList.filter(
    (p) => p.gender === "FEMALE",
  ).length;

  if (isLoading) {
    return <LoadingBlock text="Loading EHR patient directory…" />;
  }

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <PageHeader
        title="Patient Directory"
        description="Search, view, and manage electronic health records (EHR) & dossiers"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
            >
              <UserPlus size={15} />
              <span>Enroll Patient</span>
            </button>
          </div>
        }
      />

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {rawPatientsList.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Active Directory
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {maleCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Male Patients
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
            <HeartPulse size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {femaleCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Female Patients
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            100%
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              HIPAA
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Encrypted EHR
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directory by name, MRN, phone…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs shadow-xs focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Blood Group Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            Blood:
          </span>
          {[
            { id: "ALL", label: "All" },
            { id: "O_POS", label: "O+" },
            { id: "A_POS", label: "A+" },
            { id: "B_POS", label: "B+" },
            { id: "AB_POS", label: "AB+" },
          ].map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBloodFilter(bg.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                bloodFilter === bg.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {bg.label}
            </button>
          ))}
        </div>
      </div>

      {/* TanStack Table */}
      <PatientTable
        patients={filteredPatients}
        onSelectPatient={(p) => setSelectedPatient(p)}
      />

      {/* Slide-over Patient Dossier Drawer */}
      <PatientDossierDrawer
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        onNavigate={onNavigate}
      />

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New Patient
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate a medical record number (MRN) and initiate EHR
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Aung"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Last Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kyaw"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gender *
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Blood Group
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) =>
                      setForm({ ...form, bloodGroup: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  >
                    <option value="A_POS">A+</option>
                    <option value="A_NEG">A-</option>
                    <option value="B_POS">B+</option>
                    <option value="B_NEG">B-</option>
                    <option value="O_POS">O+</option>
                    <option value="O_NEG">O-</option>
                    <option value="AB_POS">AB+</option>
                    <option value="AB_NEG">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="09..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-colors"
                >
                  {isCreating ? "Registering…" : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
