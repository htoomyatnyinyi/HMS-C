import React, { useState } from "react";
import {
  X,
  Phone,
  Calendar,
  Droplet,
  FileText,
  Stethoscope,
  Pill,
  CreditCard,
  Edit2,
  Check,
  Copy,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";
import {
  type Patient,
  useUpdatePatientMutation,
  useGetPatientEncountersQuery,
  useGetPatientPrescriptionsQuery,
  useGetPatientInvoicesQuery,
  useGetPatientAllergiesQuery,
} from "../../features/patients/patientsApi";
import { Badge, EmptyState, Spinner } from "../ui/shared";
import { cn, formatDate, formatDateTime, calculateAge } from "../../lib/utils";
import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../../features/toast/toastSlice";
import type { NavTab } from "../layout/Sidebar";

interface PatientDossierDrawerProps {
  patient: Patient | null;
  onClose: () => void;
  onNavigate?: (tab: NavTab) => void;
}

export const PatientDossierDrawer: React.FC<PatientDossierDrawerProps> = ({
  patient,
  onClose,
  onNavigate,
}) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<
    "overview" | "encounters" | "prescriptions" | "billing"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: patient?.firstName || "",
    lastName: patient?.lastName || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    dateOfBirth: patient?.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
    bloodGroup: patient?.bloodGroup || "O_POS",
    gender: patient?.gender || "MALE",
  });

  const [updatePatient, { isLoading: isUpdating }] = useUpdatePatientMutation();

  // Reset edit form when patient changes
  React.useEffect(() => {
    if (patient) {
      setEditForm({
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        phone: patient.phone || "",
        email: patient.email || "",
        dateOfBirth: patient.dateOfBirth
          ? patient.dateOfBirth.split("T")[0]
          : "",
        bloodGroup: patient.bloodGroup || "O_POS",
        gender: patient.gender || "MALE",
      });
      setIsEditing(false);
    }
  }, [patient]);

  const patientId = patient?.id || "";

  // Queries for the tabs
  const { data: encountersData, isLoading: loadingEncounters } =
    useGetPatientEncountersQuery(patientId, { skip: !patientId });
  const { data: prescriptionsData, isLoading: loadingPrescriptions } =
    useGetPatientPrescriptionsQuery(patientId, { skip: !patientId });
  const { data: invoicesData, isLoading: loadingInvoices } =
    useGetPatientInvoicesQuery(patientId, { skip: !patientId });
  const { data: allergiesData } = useGetPatientAllergiesQuery(patientId, {
    skip: !patientId,
  });

  if (!patient) return null;

  const handleCopyMRN = () => {
    navigator.clipboard.writeText(patient.mrn);
    dispatch(
      addToast({
        type: "info",
        title: "MRN Copied",
        message: `${patient.mrn} copied to clipboard`,
      }),
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePatient({
        id: patient.id,
        data: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone || undefined,
          email: editForm.email || undefined,
          dateOfBirth: editForm.dateOfBirth
            ? new Date(editForm.dateOfBirth).toISOString()
            : undefined,
          bloodGroup: editForm.bloodGroup,
          gender: editForm.gender as "MALE" | "FEMALE" | "OTHER" | "UNKNOWN",
        },
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Profile Updated",
          message: "Patient demographics updated successfully",
        }),
      );
      setIsEditing(false);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to update patient profile";
      dispatch(
        addToast({
          type: "error",
          title: "Update Failed",
          message: errorMsg || "Failed to update patient profile",
        }),
      );
    }
  };

  const encounters = encountersData?.data || [];
  const prescriptions = prescriptionsData?.data || [];
  const invoices = invoicesData?.data || [];
  const allergies = allergiesData?.data || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Container */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header Capsule */}
        <div className="p-6 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl uppercase shadow-md border border-white/20",
                  patient.gender === "FEMALE"
                    ? "bg-linear-to-br from-pink-500 to-rose-600"
                    : "bg-linear-to-br from-blue-500 to-indigo-600",
                )}
              >
                {patient.firstName[0]}
                {patient.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit Demographics"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-blue-200">
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                    {patient.mrn}
                    <button
                      onClick={handleCopyMRN}
                      className="hover:text-white"
                      title="Copy MRN"
                    >
                      <Copy size={11} />
                    </button>
                  </span>
                  <span>•</span>
                  <span>{patient.gender}</span>
                  {patient.dateOfBirth && (
                    <>
                      <span>•</span>
                      <span>{calculateAge(patient.dateOfBirth)}</span>
                    </>
                  )}
                  {patient.bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-rose-300">
                        Type {patient.bloodGroup.replace("_", "")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={() => {
                onClose();
                onNavigate?.("encounters");
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Stethoscope size={14} />
              <span>Consultation</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigate?.("appointments");
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/10"
            >
              <Calendar size={14} />
              <span>Book Visit</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigate?.("billing");
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/10"
            >
              <CreditCard size={14} />
              <span>Invoice</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/70 flex-shrink-0">
          {[
            { id: "overview", label: "Demographics & EHR", icon: FileText },
            {
              id: "encounters",
              label: `Encounters (${encounters.length})`,
              icon: Activity,
            },
            {
              id: "prescriptions",
              label: `Rx Meds (${prescriptions.length})`,
              icon: Pill,
            },
            {
              id: "billing",
              label: `Invoices (${invoices.length})`,
              icon: CreditCard,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all -mb-px",
                  active
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {isEditing ? (
                <form
                  onSubmit={handleSaveEdit}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Edit Demographics
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        First Name
                      </label>
                      <input
                        required
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, firstName: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Last Name
                      </label>
                      <input
                        required
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Gender
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) =>
                          setEditForm({ ...editForm, gender: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Blood Group
                      </label>
                      <select
                        value={editForm.bloodGroup}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bloodGroup: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      {isUpdating ? (
                        <Spinner size={14} className="text-white" />
                      ) : (
                        <Check size={14} />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Info Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Phone size={14} className="text-blue-500" />
                      Contact Coordinates
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-mono font-medium text-slate-900">
                          {patient.phone || "Not recorded"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-medium text-slate-900">
                          {patient.email || "Not recorded"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Registered:</span>
                        <span className="text-slate-700">
                          {formatDate(patient.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Biological Profile Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Droplet size={14} className="text-rose-500" />
                      Biological Profile
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Blood Group:</span>
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {patient.bloodGroup
                            ? patient.bloodGroup.replace("_", "")
                            : "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Date of Birth:</span>
                        <span className="font-medium text-slate-900">
                          {patient.dateOfBirth
                            ? formatDate(patient.dateOfBirth)
                            : "Not recorded"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Age:</span>
                        <span className="font-medium text-slate-900">
                          {calculateAge(patient.dateOfBirth)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Known Allergies Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-500" />
                    Documented Allergies ({allergies.length})
                  </h4>
                </div>

                {allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy) => (
                      <div
                        key={allergy.id}
                        className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <span className="font-bold">{allergy.substance}</span>
                        {allergy.reaction && (
                          <span className="text-amber-600">
                            ({allergy.reaction})
                          </span>
                        )}
                        {allergy.severity && (
                          <Badge variant="warning">{allergy.severity}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No active allergies reported in electronic health record.
                  </p>
                )}
              </div>

              {/* Quick Health Summary Stat Blocks */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <div className="text-xl font-bold text-blue-700">
                    {encounters.length}
                  </div>
                  <div className="text-[11px] font-medium text-blue-600 mt-0.5">
                    Total Visits
                  </div>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                  <div className="text-xl font-bold text-purple-700">
                    {prescriptions.length}
                  </div>
                  <div className="text-[11px] font-medium text-purple-600 mt-0.5">
                    Rx Scripts
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                  <div className="text-xl font-bold text-emerald-700">
                    {invoices.length}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-600 mt-0.5">
                    Invoices
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENCOUNTERS */}
          {activeTab === "encounters" && (
            <div className="space-y-3">
              {loadingEncounters ? (
                <div className="py-12 flex justify-center">
                  <Spinner size={24} className="text-blue-600" />
                </div>
              ) : encounters.length > 0 ? (
                encounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {enc.encounterNo}
                        </span>
                        <Badge
                          variant={
                            enc.class === "EMERGENCY"
                              ? "danger"
                              : enc.class === "INPATIENT"
                                ? "info"
                                : "success"
                          }
                        >
                          {enc.class}
                        </Badge>
                      </div>
                      <Badge
                        variant={
                          enc.status === "FINISHED" ? "success" : "warning"
                        }
                      >
                        {enc.status}
                      </Badge>
                    </div>

                    {enc.chiefComplaint && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                        <span className="font-semibold text-slate-500">
                          Chief Complaint:{" "}
                        </span>
                        {enc.chiefComplaint}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {enc.startedAt
                          ? formatDateTime(enc.startedAt)
                          : "Time recorded"}
                      </span>
                      {enc.doctor && (
                        <span>
                          Physician: Dr. {enc.doctor.firstName}{" "}
                          {enc.doctor.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No encounters recorded"
                  description="Start a consultation encounter from the top action button."
                />
              )}
            </div>
          )}

          {/* TAB 3: PRESCRIPTIONS */}
          {activeTab === "prescriptions" && (
            <div className="space-y-3">
              {loadingPrescriptions ? (
                <div className="py-12 flex justify-center">
                  <Spinner size={24} className="text-blue-600" />
                </div>
              ) : prescriptions.length > 0 ? (
                prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {rx.prescriptionNo}
                        </span>
                        <Badge
                          variant={
                            rx.status === "DISPENSED" ? "success" : "info"
                          }
                        >
                          {rx.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatDate(rx.createdAt)}
                      </span>
                    </div>

                    {rx.items && rx.items.length > 0 ? (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg bg-slate-50/50">
                        {rx.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">
                                {item.dose
                                  ? `${item.dose} • `
                                  : "Formulary Med • "}
                              </span>
                              <span className="text-slate-600">
                                {item.frequency || "Daily"}
                              </span>
                              {item.instructions && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {item.instructions}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-blue-600">
                                Qty: {item.quantity}
                              </span>
                              {item.durationDays && (
                                <span className="text-[11px] text-slate-400 block">
                                  {item.durationDays} days
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {rx.notes || "No items listed"}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No active prescriptions"
                  description="Prescriptions issued during consultations will appear here."
                />
              )}
            </div>
          )}

          {/* TAB 4: BILLING */}
          {activeTab === "billing" && (
            <div className="space-y-3">
              {loadingInvoices ? (
                <div className="py-12 flex justify-center">
                  <Spinner size={24} className="text-blue-600" />
                </div>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {inv.invoiceNo}
                        </span>
                        <Badge
                          variant={
                            inv.status === "PAID"
                              ? "success"
                              : inv.status === "PARTIAL"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Issued on {formatDate(inv.createdAt)}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm font-mono">
                        MMK {Number(inv.totalAmount).toLocaleString()}
                      </div>
                      {Number(inv.balanceAmount) > 0 ? (
                        <span className="text-[11px] font-semibold text-rose-600 block">
                          Bal: MMK {Number(inv.balanceAmount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 block">
                          Fully Settled
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No invoices generated"
                  description="Billing invoices issued for this patient will appear here."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
