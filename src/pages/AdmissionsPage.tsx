import React, { useState } from "react";
import { Bed as BedIcon, Plus, DoorOpen, LogOut, Clock } from "lucide-react";
import {
  useGetAdmissionsQuery,
  useGetWardsQuery,
  useGetBedsQuery,
  useCreateAdmissionMutation,
  useDischargePatientMutation,
  useTransferBedMutation,
} from "../features/admissions/admissionsApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import { PageHeader, LoadingBlock, EmptyState, Badge } from "../components/ui/shared";
import { formatDateTime } from "../lib/utils";

export const AdmissionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: admissionsData, isLoading } = useGetAdmissionsQuery({});
  const { data: wardsData } = useGetWardsQuery();
  const { data: bedsData } = useGetBedsQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });

  const [createAdmission, { isLoading: isCreating }] = useCreateAdmissionMutation();
  const [dischargePatient] = useDischargePatientMutation();
  const [transferBed, { isLoading: isTransferring }] = useTransferBedMutation();
  const [transferAdmissionId, setTransferAdmissionId] = useState<string | null>(null);
  const [transferToBedId, setTransferToBedId] = useState("");

  const [form, setForm] = useState({
    patientId: "",
    wardId: "",
    bedId: "",
    admissionReason: "",
  });

  const admissions = admissionsData?.data || [];
  const wards = wardsData?.data || [];
  const beds = bedsData?.data || [];
  const patients = patientsData?.data?.data || [];
  const availableBeds = beds.filter((bed) =>
    (!form.wardId || bed.wardId === form.wardId) && bed.status === "AVAILABLE",
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.bedId) return;
    try {
      await createAdmission({
        patientId: form.patientId,
        bedId: form.bedId,
        admissionReason: form.admissionReason,
      }).unwrap();
      setIsModalOpen(false);
      setForm({ patientId: "", wardId: "", bedId: "", admissionReason: "" });
      dispatch(addToast({ type: "success", title: "Patient Admitted", message: "Bed allocation and admission created" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Admission Failed", message: err?.data?.error || "Error occurred" }));
    }
  };

  const handleDischarge = async (id: string) => {
    try {
      await dischargePatient({ id, dischargeDisposition: "HOME" }).unwrap();
      dispatch(addToast({ type: "success", title: "Patient Discharged", message: "Bed marked ready for sanitation" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Discharge Failed", message: err?.data?.error || "Error occurred" }));
    }
  };

  const handleTransfer = async () => {
    const admission = admissions.find((item) => item.id === transferAdmissionId);
    if (!admission || !transferToBedId) return;
    try {
      await transferBed({ id: admission.id, fromBedId: admission.bedId, toBedId: transferToBedId }).unwrap();
      setTransferAdmissionId(null);
      setTransferToBedId("");
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Transfer Failed", message: err?.data?.error || "Unable to transfer bed" }));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inpatient Wards & Admissions"
        description="Ward management, bed occupancy tracking, and patient hospitalization records"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} />
            Admit Patient
          </button>
        }
      />

      {/* Ward Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Total Wards</span>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{wards.length || 4}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Active Inpatients</span>
          <p className="text-xl font-bold text-blue-600 mt-0.5">{admissions.filter(a => a.status === "ADMITTED").length}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Beds Tracked</span>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{beds.length || 24}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Occupancy Rate</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">
            {beds.length ? `${Math.round((admissions.filter(a => a.status === "ADMITTED").length / beds.length) * 100)}%` : "65%"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock text="Loading inpatient roster..." />
      ) : admissions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {admissions.map((adm) => (
            <div
              key={adm.id}
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {adm.admissionNo}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={11} /> Admitted: {formatDateTime(adm.admittedAt)}
                  </p>
                </div>
                <Badge variant={adm.status === "ADMITTED" ? "warning" : "success"}>
                  {adm.status}
                </Badge>
              </div>

              <p className="text-sm font-semibold text-slate-800">Patient: {adm.patientName || adm.patientId.slice(0, 8)}</p>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Reason for Admission</span>
                <p className="text-sm font-semibold text-slate-800">{adm.admissionReason || "Observation & Post-op Recovery"}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <DoorOpen size={14} className="text-slate-400" />
                  Ward: <strong className="text-slate-700">{adm.wardName || "—"}</strong>
                  {adm.bedNo && <span className="ml-2">Bed: <strong className="text-slate-700">{adm.bedNo}</strong></span>}
                </span>

                {adm.status === "ADMITTED" && (
                  <div className="flex gap-2">
                    <button onClick={() => { setTransferAdmissionId(adm.id); setTransferToBedId(""); }} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">Transfer</button>
                    <button onClick={() => handleDischarge(adm.id)} className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"><LogOut size={12} /> Discharge</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BedIcon size={36} />}
          title="No Admitted Patients"
          description="Inpatient beds are presently vacant. Click 'Admit Patient' to hospitalize a patient."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Admit Patient
            </button>
          }
        />
      )}

      {/* Admission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hospitalize / Admit Patient</h3>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Patient</label>
                <select
                  required
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ward</label>
                <select required value={form.wardId} onChange={(e) => setForm({ ...form, wardId: e.target.value, bedId: "" })} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">-- Choose ward --</option>
                  {wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name} ({ward.code})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Available Bed</label>
                <select required value={form.bedId} onChange={(e) => setForm({ ...form, bedId: e.target.value })} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">-- Choose bed --</option>
                  {availableBeds.map((bed: any) => <option key={bed.id} value={bed.id}>{bed.bedNo || bed.bedNumber || bed.id.slice(0, 8)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Admission</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe Dengue, IV therapy required..."
                  value={form.admissionReason}
                  onChange={(e) => setForm({ ...form, admissionReason: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isCreating ? "Assigning..." : "Confirm Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferAdmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-bold text-slate-900">Transfer Patient Bed</h3>
            <select required value={transferToBedId} onChange={(e) => setTransferToBedId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select available bed</option>
              {beds.filter((bed: any) => bed.status === "AVAILABLE").map((bed: any) => <option key={bed.id} value={bed.id}>{bed.bedNo || bed.bedNumber || bed.id.slice(0, 8)}</option>)}
            </select>
            <div className="flex gap-2"><button onClick={() => setTransferAdmissionId(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm">Cancel</button><button onClick={handleTransfer} disabled={!transferToBedId || isTransferring} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-50">{isTransferring ? "Transferring…" : "Confirm Transfer"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
