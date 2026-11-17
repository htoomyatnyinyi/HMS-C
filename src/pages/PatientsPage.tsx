import React, { useState } from "react";
import { UserPlus, RefreshCw, X } from "lucide-react";
import { useGetPatientsQuery, useCreatePatientMutation, type Patient } from "../features/patients/patientsApi";
import { PatientTable } from "../components/patients/PatientTable";

export const PatientsPage: React.FC = () => {
  const [page] = useState(1);
  const { data, isLoading, refetch } = useGetPatientsQuery({ page, limit: 50 });
  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form State
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
        tenantId: "00000000-0000-0000-0000-000000000001",
        hospitalId: "00000000-0000-0000-0000-000000000001",
      }).unwrap();
      setIsModalOpen(false);
      setForm({ firstName: "", lastName: "", gender: "MALE", phone: "", bloodGroup: "O_POS" });
    } catch (err) {
      console.error("Failed to register patient:", err);
    }
  };

  const patientsList = data?.data?.data || [];

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Patient Directory</h2>
          <p className="text-xs text-slate-500">Search and manage electronic health records (EHR)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserPlus size={15} />
            New Patient
          </button>
        </div>
      </div>

      {/* TanStack Responsive Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading patient directory...
        </div>
      ) : (
        <PatientTable patients={patientsList} onSelectPatient={(p) => setSelectedPatient(p)} />
      )}

      {/* Patient Detail Drawer / Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedPatient.mrn}</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Gender</span>
                <span className="font-medium text-slate-800">{selectedPatient.gender}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Contact Number</span>
                <span className="font-medium text-slate-800">{selectedPatient.phone || "None"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Blood Type</span>
                <span className="font-bold text-red-600">{selectedPatient.bloodGroup || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Registered On</span>
                <span className="font-medium text-slate-800">
                  {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : "Recent"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Register New Patient</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <label className="text-xs font-medium text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isCreating ? "Saving..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
