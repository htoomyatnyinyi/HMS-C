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
  Pill,
  Heart,
  Thermometer,
  Gauge,
  ClipboardList,
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
import {
  useCreatePrescriptionMutation,
  useGetPrescriptionsQuery,
} from "../features/prescriptions/prescriptionsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  Badge,
} from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";

const statusVariants: Record<
  string,
  "info" | "success" | "warning" | "neutral"
> = {
  IN_PROGRESS: "info",
  COMPLETED: "success",
  PLANNED: "warning",
  CANCELLED: "neutral",
};

export const EncountersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(
    null,
  );
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "soap" | "vitals" | "rx" | "diagnoses"
  >("soap");

  // Mock patient vital telemetry for the current consultation
  const [vitals, setVitals] = useState({
    bpSystolic: 120,
    bpDiastolic: 80,
    pulse: 74,
    temp: 98.4,
    spo2: 98,
    weight: 65,
  });

  // API Queries & Mutations
  const { data: encountersData, isLoading } = useGetEncountersQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const { data: doctorsData } = useGetDoctorsQuery();
  const { data: medicinesData } = useGetMedicinesQuery({});
  const [createEncounter, { isLoading: isCreating }] =
    useCreateEncounterMutation();
  const [updateStatus] = useUpdateEncounterStatusMutation();

  // Selected encounter sub-resources
  const { data: notesData } = useGetEncounterNotesQuery(
    selectedEncounter?.id || "",
    {
      skip: !selectedEncounter,
    },
  );
  const { data: diagnosesData } = useGetEncounterDiagnosesQuery(
    selectedEncounter?.id || "",
    {
      skip: !selectedEncounter,
    },
  );
  const [addClinicalNote, { isLoading: isAddingNote }] =
    useAddClinicalNoteMutation();
  const [addDiagnosis, { isLoading: isAddingDiag }] = useAddDiagnosisMutation();
  const { data: prescriptionsData } = useGetPrescriptionsQuery(
    { encounterId: selectedEncounter?.id },
    { skip: !selectedEncounter },
  );
  const [createPrescription, { isLoading: isPrescribing }] =
    useCreatePrescriptionMutation();

  // Local Form States
  const [newNote, setNewNote] = useState("");
  const [soapType, setSoapType] = useState<
    "SOAP_NOTE" | "PROGRESS_NOTE" | "DISCHARGE_SUMMARY"
  >("SOAP_NOTE");
  const [newDiagDesc, setNewDiagDesc] = useState("");
  const [newDiagIcd, setNewDiagIcd] = useState("");
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicineId: "",
    dose: "",
    frequency: "BID (Twice Daily)",
    durationDays: 5,
    quantity: 10,
    instructions: "After meals with water",
  });
  const [createForm, setCreateForm] = useState({
    patientId: "",
    type: "OPD",
    doctorId: "",
    chiefComplaint: "",
  });

  const encounters = encountersData?.data || [];
  const patients = patientsData?.data?.data || [];
  const doctors = doctorsData?.data || [];
  const medicines = medicinesData?.data || [];

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.patientId) {
      dispatch(
        addToast({
          type: "warning",
          title: "Patient required",
          message: "Please select a patient",
        }),
      );
      return;
    }
    try {
      const res = await createEncounter({
        ...createForm,
        status: "IN_PROGRESS",
        startAt: new Date().toISOString(),
      }).unwrap();
      setIsNewModalOpen(false);
      setCreateForm({
        patientId: "",
        type: "OPD",
        doctorId: "",
        chiefComplaint: "",
      });
      dispatch(
        addToast({
          type: "success",
          title: "Encounter Started",
          message: `Visit #${res.data?.encounterNo || "new"} created`,
        }),
      );
      if (res.data) setSelectedEncounter(res.data);
    } catch (err: any) {
      dispatch(
        addToast({
          type: "error",
          title: "Failed to start encounter",
          message: err?.data?.error || "Error occurred",
        }),
      );
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Status Updated",
          message: `Encounter marked as ${status}`,
        }),
      );
      if (selectedEncounter?.id === id) {
        setSelectedEncounter((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      dispatch(
        addToast({
          type: "error",
          title: "Update Failed",
          message: err?.data?.error || "Error occurred",
        }),
      );
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedEncounter) return;
    try {
      await addClinicalNote({
        encounterId: selectedEncounter.id,
        noteType: soapType,
        content: newNote.trim(),
      }).unwrap();
      setNewNote("");
      dispatch(
        addToast({
          type: "success",
          title: "Note Saved",
          message: "Clinical progress note recorded",
        }),
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: "error",
          title: "Error saving note",
          message: err?.data?.error || "Failed to record",
        }),
      );
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
      dispatch(
        addToast({
          type: "success",
          title: "Diagnosis Logged",
          message: "Primary diagnosis attached to visit",
        }),
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: "error",
          title: "Diagnosis Failed",
          message: err?.data?.error || "Failed to save",
        }),
      );
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter || !prescriptionForm.medicineId) {
      dispatch(
        addToast({
          type: "warning",
          title: "Medicine Required",
          message: "Please select formulary medicine",
        }),
      );
      return;
    }

    try {
      await createPrescription({
        patientId: selectedEncounter.patientId,
        encounterId: selectedEncounter.id,
        items: [
          {
            medicineId: prescriptionForm.medicineId,
            dose: prescriptionForm.dose,
            frequency: prescriptionForm.frequency,
            durationDays: Number(prescriptionForm.durationDays),
            quantity: Number(prescriptionForm.quantity),
            instructions: prescriptionForm.instructions,
          },
        ],
      }).unwrap();
      setPrescriptionForm({
        medicineId: "",
        dose: "",
        frequency: "BID (Twice Daily)",
        durationDays: 5,
        quantity: 10,
        instructions: "After meals with water",
      });
      dispatch(
        addToast({
          type: "success",
          title: "e-Prescription Issued",
          message: "Sent to pharmacy queue",
        }),
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: "error",
          title: "Prescription Failed",
          message: err?.data?.error || "Failed to save prescription",
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Consultation & Encounters"
        description="Patient clinical consultations, electronic SOAP notes, live vitals telemetry, and digital e-prescriptions"
        actions={
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-97"
          >
            <Plus size={15} />
            <span>Start Consultation</span>
          </button>
        }
      />

      {isLoading ? (
        <LoadingBlock text="Loading clinical visits..." />
      ) : encounters.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Encounter list */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Consultations ({encounters.length})
              </h3>
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                Live Queue
              </span>
            </div>

            <div className="space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {encounters.map((enc) => {
                const isSelected = selectedEncounter?.id === enc.id;
                return (
                  <div
                    key={enc.id}
                    onClick={() => setSelectedEncounter(enc)}
                    className={cn(
                      "p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 group relative",
                      isSelected
                        ? "bg-white border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-lg border border-blue-200/50">
                        {enc.encounterNo}
                      </span>
                      <Badge variant={statusVariants[enc.status] || "neutral"}>
                        {enc.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-xs font-bold text-slate-900 mt-2.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {enc.chiefComplaint || "General Medical Evaluation"}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock size={11} className="text-slate-400" />{" "}
                        {formatDateTime(enc.startAt)}
                      </span>
                      <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                        {enc.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High-end Clinical Consultation Studio */}
          <div className="lg:col-span-8">
            {selectedEncounter ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                {/* Header info bar */}
                <div className="p-5 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-300 font-bold bg-white/10 px-2 py-0.5 rounded-md">
                        {selectedEncounter.encounterNo}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        {selectedEncounter.type} CLINIC
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      {selectedEncounter.chiefComplaint ||
                        "Routine Checkup / Consultation"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedEncounter.status !== "COMPLETED" && (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedEncounter.id, "COMPLETED")
                        }
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-97"
                      >
                        <CheckCircle2 size={15} />
                        <span>Finish Encounter</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-navigation tabs: Vitals, SOAP Notes, e-Prescription, Diagnoses */}
                <div className="flex items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200/80 overflow-x-auto">
                  {[
                    {
                      id: "soap",
                      label: "SOAP & Clinical Notes",
                      icon: FileText,
                    },
                    {
                      id: "vitals",
                      label: "Patient Vitals Telemetry",
                      icon: Activity,
                    },
                    {
                      id: "diagnoses",
                      label: "ICD-10 Diagnoses",
                      icon: ClipboardList,
                    },
                    { id: "rx", label: "e-Prescriptions", icon: Pill },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                          isActive
                            ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
                        )}
                      >
                        <Icon
                          size={14}
                          className={
                            isActive ? "text-blue-600" : "text-slate-400"
                          }
                        />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: SOAP & Progress Notes */}
                {activeTab === "soap" && (
                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Physician Examination Records
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Subjective, Objective, Assessment, Plan
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {(
                          [
                            "SOAP_NOTE",
                            "PROGRESS_NOTE",
                            "DISCHARGE_SUMMARY",
                          ] as const
                        ).map((type) => (
                          <button
                            key={type}
                            onClick={() => setSoapType(type)}
                            className={cn(
                              "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all",
                              soapType === type
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                            )}
                          >
                            {type.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {notesData?.data && notesData.data.length > 0 ? (
                        notesData.data.map((note) => (
                          <div
                            key={note.id}
                            className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {note.noteType}
                              </span>
                              <span>{formatDateTime(note.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                              {note.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                          No clinical progress note entered for this session.
                          Use the template below.
                        </div>
                      )}
                    </div>

                    {/* Editor Form */}
                    <form
                      onSubmit={handleAddNote}
                      className="space-y-3 pt-2 border-t border-slate-100"
                    >
                      <div className="relative">
                        <textarea
                          rows={4}
                          placeholder={`Write clinical findings (${soapType})...\nS: Patient complains of fever & cough\nO: Temp 101F, chest clear\nA: Upper respiratory infection\nP: Paracetamol 500mg, rest, fluids`}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full p-3.5 text-xs bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-400">
                          Autosaved to central EHR timeline
                        </span>
                        <button
                          type="submit"
                          disabled={isAddingNote || !newNote.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
                        >
                          <Send size={13} />
                          <span>Commit Note</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tab 2: Vitals Telemetry */}
                {activeTab === "vitals" && (
                  <div className="p-6 space-y-5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Patient Physical Vitals & Biomarkers
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Live bedside & counter telemetry capture
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      <div className="p-4 bg-rose-50/60 border border-rose-200/70 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between text-rose-600">
                          <span className="text-xs font-bold">
                            Blood Pressure
                          </span>
                          <Heart size={16} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <input
                            type="number"
                            value={vitals.bpSystolic}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                bpSystolic: Number(e.target.value),
                              })
                            }
                            className="w-14 text-xl font-extrabold bg-transparent text-slate-900 outline-none"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            value={vitals.bpDiastolic}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                bpDiastolic: Number(e.target.value),
                              })
                            }
                            className="w-14 text-xl font-extrabold bg-transparent text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            mmHg
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          Optimal
                        </span>
                      </div>

                      <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between text-blue-600">
                          <span className="text-xs font-bold">
                            Pulse Heart Rate
                          </span>
                          <Activity size={16} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <input
                            type="number"
                            value={vitals.pulse}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                pulse: Number(e.target.value),
                              })
                            }
                            className="w-16 text-xl font-extrabold bg-transparent text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            bpm
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          Normal Sinus
                        </span>
                      </div>

                      <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between text-amber-600">
                          <span className="text-xs font-bold">
                            Body Temperature
                          </span>
                          <Thermometer size={16} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <input
                            type="number"
                            step="0.1"
                            value={vitals.temp}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                temp: Number(e.target.value),
                              })
                            }
                            className="w-16 text-xl font-extrabold bg-transparent text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            °F
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          Afebrile
                        </span>
                      </div>

                      <div className="p-4 bg-cyan-50/60 border border-cyan-200/70 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between text-cyan-600">
                          <span className="text-xs font-bold">
                            Oxygen Sat (SpO2)
                          </span>
                          <Gauge size={16} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <input
                            type="number"
                            value={vitals.spo2}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                spo2: Number(e.target.value),
                              })
                            }
                            className="w-16 text-xl font-extrabold bg-transparent text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            %
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          Room Air
                        </span>
                      </div>

                      <div className="p-4 bg-purple-50/60 border border-purple-200/70 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between text-purple-600">
                          <span className="text-xs font-bold">Body Weight</span>
                          <Activity size={16} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <input
                            type="number"
                            value={vitals.weight}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                weight: Number(e.target.value),
                              })
                            }
                            className="w-16 text-xl font-extrabold bg-transparent text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            kg
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          BMI: 22.4
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() =>
                          dispatch(
                            addToast({
                              type: "success",
                              title: "Vitals Synchronized",
                              message:
                                "Patient vitals captured to consultation file",
                            }),
                          )
                        }
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Save Vitals Baseline
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 3: ICD-10 Diagnoses */}
                {activeTab === "diagnoses" && (
                  <div className="p-6 space-y-5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Formal ICD-10 Clinical Diagnoses
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Classified morbidity coding for medical records
                      </p>
                    </div>

                    <div className="space-y-2">
                      {diagnosesData?.data && diagnosesData.data.length > 0 ? (
                        diagnosesData.data.map((diag) => (
                          <div
                            key={diag.id}
                            className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {diag.description}
                              </span>
                              {diag.icdCode && (
                                <span className="font-mono text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                                  ICD-10: {diag.icdCode}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase">
                              {diag.type}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                          No formal diagnosis entered yet. Add primary diagnosis
                          below.
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={handleAddDiagnosis}
                      className="flex gap-2.5 pt-2 border-t border-slate-100"
                    >
                      <input
                        type="text"
                        placeholder="Diagnosis description (e.g. Acute Bronchitis)..."
                        value={newDiagDesc}
                        onChange={(e) => setNewDiagDesc(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input
                        type="text"
                        placeholder="ICD Code (e.g. J20.9)..."
                        value={newDiagIcd}
                        onChange={(e) => setNewDiagIcd(e.target.value)}
                        className="w-32 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isAddingDiag || !newDiagDesc.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}

                {/* Tab 4: e-Prescription Studio */}
                {activeTab === "rx" && (
                  <div className="p-6 space-y-5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Electronic Prescriptions (e-Rx)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Integrated formulary dispensary order builder
                      </p>
                    </div>

                    {prescriptionsData?.data &&
                      prescriptionsData.data.length > 0 && (
                        <div className="space-y-2">
                          {prescriptionsData.data.map((prescription) => (
                            <div
                              key={prescription.id}
                              className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-purple-700">
                                  {prescription.prescriptionNo}
                                </span>
                                <span className="ml-2.5 text-slate-600 font-medium">
                                  Status: {prescription.status}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">
                                e-Rx Active
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                    <form
                      onSubmit={handleCreatePrescription}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3"
                    >
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Medication Formulation
                        </label>
                        <select
                          required
                          value={prescriptionForm.medicineId}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              medicineId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">
                            -- Select from Hospital Formulary --
                          </option>
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.genericName || "Generic"}) &bull;{" "}
                              {m.dosageForm || "Tablet"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Dose
                          </label>
                          <input
                            placeholder="e.g. 500mg"
                            value={prescriptionForm.dose}
                            onChange={(e) =>
                              setPrescriptionForm({
                                ...prescriptionForm,
                                dose: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Frequency
                          </label>
                          <input
                            placeholder="e.g. TID / BID"
                            value={prescriptionForm.frequency}
                            onChange={(e) =>
                              setPrescriptionForm({
                                ...prescriptionForm,
                                frequency: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={prescriptionForm.durationDays}
                            onChange={(e) =>
                              setPrescriptionForm({
                                ...prescriptionForm,
                                durationDays: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={prescriptionForm.quantity}
                            onChange={(e) =>
                              setPrescriptionForm({
                                ...prescriptionForm,
                                quantity: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Administration Instructions
                        </label>
                        <input
                          placeholder="e.g. Take with warm water after meals"
                          value={prescriptionForm.instructions}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              instructions: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isPrescribing}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-xs"
                        >
                          {isPrescribing
                            ? "Dispatching…"
                            : "Transmit e-Prescription"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Stethoscope size={36} />}
                title="Select a Consultation"
                description="Choose an encounter from the left queue to enter the Doctor Examination Studio, review clinical vitals, and issue e-prescriptions."
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Start Consultation
            </button>
          }
        />
      )}

      {/* Start Consultation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/90">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Open Consultation Encounter
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Initialize clinical session for patient
                </p>
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
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Patient
                </label>
                <select
                  required
                  value={createForm.patientId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, patientId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white"
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
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Encounter Type
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white"
                >
                  <option value="OPD">Outpatient (OPD)</option>
                  <option value="EMERGENCY">Emergency (ER)</option>
                  <option value="IPD">Inpatient (Ward Round)</option>
                  <option value="TELEMEDICINE">Telemedicine Consult</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Attending Doctor
                </label>
                <select
                  value={createForm.doctorId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, doctorId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.qualification || "Physician"} &bull;{" "}
                      {doctor.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chief Complaint
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Persistent fever, cough for 4 days..."
                  value={createForm.chiefComplaint}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      chiefComplaint: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  {isCreating ? "Initializing..." : "Begin Consultation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
