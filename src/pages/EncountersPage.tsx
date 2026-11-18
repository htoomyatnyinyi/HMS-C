import React, { useState } from "react";
import {
  Stethoscope,
  Plus,
  Clock,
  FileText,
  Activity,
  CheckCircle2,
  X,
  Send,
} from "lucide-react";
import {
  useGetEncountersQuery,
  useCreateEncounterMutation,
  useUpdateEncounterStatusMutation,
  useGetEncounterNotesQuery,
  useAddClinicalNoteMutation,
  useGetEncounterDiagnosesQuery,
  useAddDiagnosisMutation,
  type Encounter,
} from "../features/encounters/encountersApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useGetDoctorsQuery } from "../features/auth/authApi";
import { useGetMedicinesQuery } from "../features/pharmacy/pharmacyApi";
import { useCreatePrescriptionMutation, useGetPrescriptionsQuery } from "../features/prescriptions/prescriptionsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import { PageHeader, LoadingBlock, EmptyState, Badge } from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";

const statusVariants: Record<string, "info" | "success" | "warning" | "neutral"> = {
  IN_PROGRESS: "info",
  COMPLETED: "success",
  PLANNED: "warning",
  CANCELLED: "neutral",
};

export const EncountersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // API Queries & Mutations
  const { data: encountersData, isLoading } = useGetEncountersQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const { data: doctorsData } = useGetDoctorsQuery();
  const { data: medicinesData } = useGetMedicinesQuery({});
  const [createEncounter, { isLoading: isCreating }] = useCreateEncounterMutation();
  const [updateStatus] = useUpdateEncounterStatusMutation();

  // Selected encounter sub-resources
  const { data: notesData } = useGetEncounterNotesQuery(selectedEncounter?.id || "", {
    skip: !selectedEncounter,
  });
  const { data: diagnosesData } = useGetEncounterDiagnosesQuery(selectedEncounter?.id || "", {
    skip: !selectedEncounter,
  });
  const [addClinicalNote, { isLoading: isAddingNote }] = useAddClinicalNoteMutation();
  const [addDiagnosis, { isLoading: isAddingDiag }] = useAddDiagnosisMutation();
  const { data: prescriptionsData } = useGetPrescriptionsQuery(
    { encounterId: selectedEncounter?.id },
    { skip: !selectedEncounter },
  );
  const [createPrescription, { isLoading: isPrescribing }] = useCreatePrescriptionMutation();

  // Local Form States
  const [newNote, setNewNote] = useState("");
  const [newDiagDesc, setNewDiagDesc] = useState("");
  const [newDiagIcd, setNewDiagIcd] = useState("");
  const [prescriptionForm, setPrescriptionForm] = useState({ medicineId: "", dose: "", frequency: "", durationDays: 5, quantity: 1, instructions: "" });
  const [createForm, setCreateForm] = useState({
    patientId: "",
    doctorId: "",
    type: "OPD",
    chiefComplaint: "",
  });

  const encounters = encountersData?.data || [];
  const patients = patientsData?.data?.data || [];
  const doctors = doctorsData?.data || [];
  const medicines = medicinesData?.data || [];

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.patientId) {
      dispatch(addToast({ type: "warning", title: "Patient required", message: "Please select a patient" }));
      return;
    }
    try {
      const res = await createEncounter({
        ...createForm,
        status: "IN_PROGRESS",
        startAt: new Date().toISOString(),
      }).unwrap();
      setIsNewModalOpen(false);
      setCreateForm({ patientId: "", doctorId: "", type: "OPD", chiefComplaint: "" });
      dispatch(addToast({ type: "success", title: "Encounter Started", message: `Visit #${res.data?.encounterNo || "new"} created` }));
      if (res.data) setSelectedEncounter(res.data);
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Failed to start encounter", message: err?.data?.error || "Error occurred" }));
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      dispatch(addToast({ type: "success", title: "Status Updated", message: `Encounter marked as ${status}` }));
      if (selectedEncounter?.id === id) {
        setSelectedEncounter((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Update Failed", message: err?.data?.error || "Error occurred" }));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedEncounter) return;
    try {
      await addClinicalNote({
        encounterId: selectedEncounter.id,
        noteType: "SOAP_NOTE",
        content: newNote.trim(),
      }).unwrap();
      setNewNote("");
      dispatch(addToast({ type: "success", title: "Note Saved", message: "Clinical observation recorded" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Error saving note", message: err?.data?.error || "Failed to record" }));
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagDesc.trim() || !selectedEncounter) return;
    try {
      await addDiagnosis({
        encounterId: selectedEncounter.id,
        description: newDiagDesc.trim(),
        icdCode: newDiagIcd.trim() || undefined,
        type: "PRIMARY",
      }).unwrap();
      setNewDiagDesc("");
      setNewDiagIcd("");
      dispatch(addToast({ type: "success", title: "Diagnosis Logged", message: "Primary diagnosis attached to visit" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Diagnosis Failed", message: err?.data?.error || "Failed to save" }));
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter || !prescriptionForm.medicineId) return;
    try {
      await createPrescription({
        patientId: selectedEncounter.patientId,
        encounterId: selectedEncounter.id,
        items: [{ ...prescriptionForm, durationDays: Number(prescriptionForm.durationDays), quantity: Number(prescriptionForm.quantity) }],
      }).unwrap();
      setPrescriptionForm({ medicineId: "", dose: "", frequency: "", durationDays: 5, quantity: 1, instructions: "" });
      dispatch(addToast({ type: "success", title: "Prescription Created", message: "Medicine prescription saved" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Prescription Failed", message: err?.data?.error || "Failed to save prescription" }));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Consultation & Clinical Encounters"
        description="Patient visits, doctor SOAP progress notes, vitals, and diagnoses"
        actions={
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} />
            Start Consultation
          </button>
        }
      />

      {isLoading ? (
        <LoadingBlock text="Loading clinical visits..." />
      ) : encounters.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Encounter list */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active & Recent Visits ({encounters.length})
            </h3>
            <div className="space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {encounters.map((enc) => {
                const isSelected = selectedEncounter?.id === enc.id;
                return (
                  <div
                    key={enc.id}
                    onClick={() => setSelectedEncounter(enc)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left cursor-pointer transition-all",
                      isSelected
                        ? "bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                        {enc.encounterNo}
                      </span>
                      <Badge variant={statusVariants[enc.status] || "neutral"}>
                        {enc.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mt-2 line-clamp-1">
                      {enc.chiefComplaint || "General Medical Evaluation"}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(enc.startAt)}
                      </span>
                      <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {enc.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Encounter Detailed Clinical Chart */}
          <div className="lg:col-span-2">
            {selectedEncounter ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                {/* Header info */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-300 font-bold">
                        {selectedEncounter.encounterNo}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-xs font-medium text-slate-300">
                        Type: {selectedEncounter.type}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {selectedEncounter.chiefComplaint || "Routine Checkup / Consultation"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedEncounter.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleStatusChange(selectedEncounter.id, "COMPLETED")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={14} /> Finish Visit
                      </button>
                    )}
                  </div>
                </div>

                {/* Clinical Notes & Diagnoses Sections */}
                <div className="p-5 space-y-6">
                  {/* Diagnoses List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Activity size={15} className="text-blue-600" />
                        Clinical Diagnoses
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      {diagnosesData?.data && diagnosesData.data.length > 0 ? (
                        diagnosesData.data.map((diag) => (
                          <div
                            key={diag.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{diag.description}</span>
                              {diag.icdCode && (
                                <span className="ml-2 font-mono text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  ICD-10: {diag.icdCode}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{diag.type}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No formal diagnosis entered yet.</p>
                      )}
                    </div>

                    {/* Add Diagnosis Inline */}
                    <form onSubmit={handleAddDiagnosis} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Diagnosis description (e.g. Acute Bronchitis)..."
                        value={newDiagDesc}
                        onChange={(e) => setNewDiagDesc(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="ICD Code (opt)..."
                        value={newDiagIcd}
                        onChange={(e) => setNewDiagIcd(e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isAddingDiag || !newDiagDesc.trim()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Prescription</h4>
                    {prescriptionsData?.data?.map((prescription) => (
                      <div key={prescription.id} className="rounded-lg border border-purple-100 bg-purple-50/40 p-3 text-xs">
                        <span className="font-mono font-semibold text-purple-700">{prescription.prescriptionNo}</span>
                        <span className="ml-2 text-slate-500">{prescription.status}</span>
                      </div>
                    ))}
                    <form onSubmit={handleCreatePrescription} className="grid grid-cols-2 gap-2">
                      <select required value={prescriptionForm.medicineId} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicineId: e.target.value })} className="col-span-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
                        <option value="">Select medicine</option>
                        {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} {medicine.strength || ""}</option>)}
                      </select>
                      <input placeholder="Dose (e.g. 500mg)" value={prescriptionForm.dose} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dose: e.target.value })} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                      <input placeholder="Frequency (e.g. BID)" value={prescriptionForm.frequency} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                      <input type="number" min="1" value={prescriptionForm.quantity} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, quantity: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                      <input type="number" min="1" value={prescriptionForm.durationDays} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, durationDays: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                      <input placeholder="Instructions" value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} className="col-span-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                      <button disabled={isPrescribing} className="col-span-2 rounded-lg bg-purple-600 py-2 text-xs font-semibold text-white disabled:opacity-50">{isPrescribing ? "Saving…" : "Add Prescription"}</button>
                    </form>
                  </div>

                  {/* Doctor's SOAP Clinical Notes */}
                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FileText size={15} className="text-blue-600" />
                      Doctor's Clinical & SOAP Notes
                    </h4>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {notesData?.data && notesData.data.length > 0 ? (
                        notesData.data.map((note) => (
                          <div key={note.id} className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-blue-700">{note.noteType}</span>
                              <span>{formatDateTime(note.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No notes recorded for this session yet.</p>
                      )}
                    </div>

                    {/* Add SOAP Note Form */}
                    <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                      <textarea
                        rows={3}
                        placeholder="Write clinical findings, subjective complaints, objective vitals, or treatment plan..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isAddingNote || !newNote.trim()}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                        >
                          <Send size={13} /> Save Note
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Stethoscope size={36} />}
                title="Select a Consultation"
                description="Choose an encounter from the left list to review clinical charts and write notes."
              />
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Stethoscope size={36} />}
          title="No Active Encounters"
          description="There are no consultations scheduled or in-progress. Start a new encounter for a registered patient."
          action={
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Start Consultation
            </button>
          }
        />
      )}

      {/* Start Consultation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Start Consultation</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Open a clinical session for a patient</p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEncounter} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Patient</label>
                <select
                  required
                  value={createForm.patientId}
                  onChange={(e) => setCreateForm({ ...createForm, patientId: e.target.value })}
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Encounter Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="OPD">Outpatient (OPD)</option>
                  <option value="EMERGENCY">Emergency (ER)</option>
                  <option value="IPD">Inpatient (Ward Round)</option>
                  <option value="TELEMEDICINE">Telemedicine Consult</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Doctor</label>
                <select value={createForm.doctorId} onChange={(e) => setCreateForm({ ...createForm, doctorId: e.target.value })} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">Unassigned</option>
                  {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.qualification || "Doctor"} — {doctor.id.slice(0, 8)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chief Complaint</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High fever for 3 days, dry cough..."
                  value={createForm.chiefComplaint}
                  onChange={(e) => setCreateForm({ ...createForm, chiefComplaint: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {isCreating ? "Opening..." : "Begin Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
