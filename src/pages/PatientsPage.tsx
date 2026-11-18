import React, { useState } from "react";
import {
  UserPlus,
  RefreshCw,
  X,
  FileText,
  Droplet,
  Phone as PhoneIcon,
} from "lucide-react";
import {
  useGetPatientsQuery,
  useCreatePatientMutation,
  type Patient,
} from "../features/patients/patientsApi";
import { PatientTable } from "../components/patients/PatientTable";
import { LoadingBlock, PageHeader, Badge } from "../components/ui/shared";
import { formatDate } from "../lib/utils";

export const PatientsPage: React.FC = () => {
  const [page] = useState(1);
  const { data, isLoading, refetch } = useGetPatientsQuery({ page, limit: 50 });
  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  /* ─── Form State ─── */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    phone: "",
    bloodGroup: "O_POS",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatient({
        ...form,
      }).unwrap();
      setIsModalOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        gender: "MALE",
        phone: "",
        bloodGroup: "O_POS",
      });
    } catch (err) {
      console.error("Failed to register patient:", err);
    }
  };

  const patientsList = data?.data?.data || [];

  if (isLoading) {
    return <LoadingBlock text="Loading patient directory…" />;
  }

  return (
    <div className="space-y-5">
      {/* Title Bar */}
      <PageHeader
        title="Patient Directory"
        description="Search and manage electronic health records (EHR)"
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
            >
              <UserPlus size={15} />
              New Patient
            </button>
          </>
        }
      />

      {/* Table */}
      <PatientTable
        patients={patientsList}
        onSelectPatient={(p) => setSelectedPatient(p)}
      />

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm">
                    {selectedPatient.firstName[0]}
                    {selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <span className="text-xs text-blue-100 font-mono">
                      {selectedPatient.mrn}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3">
              {[
                {
                  label: "Gender",
                  value: selectedPatient.gender,
                  icon: <FileText size={14} className="text-slate-400" />,
                },
                {
                  label: "Contact",
                  value: selectedPatient.phone || "Not provided",
                  icon: <PhoneIcon size={14} className="text-slate-400" />,
                },
                {
                  label: "Blood Type",
                  value: selectedPatient.bloodGroup || "N/A",
                  icon: <Droplet size={14} className="text-red-400" />,
                  highlight: true,
                },
                {
                  label: "Registered On",
                  value: formatDate(selectedPatient.createdAt),
                  icon: <FileText size={14} className="text-slate-400" />,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-xs text-slate-500 flex items-center gap-2">
                    {row.icon} {row.label}
                  </span>
                  {row.highlight ? (
                    <Badge variant="danger">{row.value}</Badge>
                  ) : (
                    <span className="text-xs font-medium text-slate-800">
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New Patient
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fill in the patient demographics
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    First Name
                  </label>
                  <input
                    required
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Last Name
                  </label>
                  <input
                    required
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
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
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
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

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-colors"
                >
                  {isCreating ? "Saving…" : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
