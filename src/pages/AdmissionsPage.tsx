import React, { useState } from "react";
import {
  Bed as BedIcon,
  Plus,
  DoorOpen,
  LogOut,
  Clock,
  ArrowRightLeft,
  X,
  User,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  useGetAdmissionsQuery,
  useGetWardsQuery,
  useGetBedsQuery,
  useCreateAdmissionMutation,
  useDischargePatientMutation,
  useTransferBedMutation,
  type Bed,
} from "../features/admissions/admissionsApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  Badge,
  Spinner,
} from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";

export const AdmissionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] = useState<"matrix" | "roster">("matrix");
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("ALL");

  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState<{
    id: string;
    patientName?: string;
  } | null>(null);
  const [dischargeForm, setDischargeForm] = useState({
    disposition: "HOME",
    notes: "",
  });

  const [transferTarget, setTransferTarget] = useState<{
    admissionId: string;
    fromBedId?: string;
    patientName?: string;
  } | null>(null);
  const [transferToBedId, setTransferToBedId] = useState("");

  const { data: admissionsData, isLoading, refetch } = useGetAdmissionsQuery({});
  const { data: wardsData } = useGetWardsQuery();
  const { data: bedsData } = useGetBedsQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });

  const [createAdmission, { isLoading: isCreating }] =
    useCreateAdmissionMutation();
  const [dischargePatient, { isLoading: isDischarging }] =
    useDischargePatientMutation();
  const [transferBed, { isLoading: isTransferring }] = useTransferBedMutation();

  const [admitForm, setAdmitForm] = useState({
    patientId: "",
    wardId: "",
    bedId: "",
    admissionReason: "Observation & Inpatient Medical Management",
  });

  const admissions = admissionsData?.data || [];
  const wards = wardsData?.data || [];
  const beds: Bed[] = bedsData?.data || [];
  const patients = patientsData?.data?.data || [];

  const activeAdmissions = admissions.filter((a) => a.status === "ADMITTED");
  const occupancyPercent = beds.length
    ? Math.round((activeAdmissions.length / beds.length) * 100)
    : 0;

  // Filter beds according to selected ward tab
  const displayedWards =
    selectedWardFilter === "ALL"
      ? wards
      : wards.filter((w) => w.id === selectedWardFilter);

  // Available beds for form
  const availableBedsForForm = beds.filter((b) => {
    const isAvail = b.status === "AVAILABLE";
    if (admitForm.wardId) {
      return isAvail && b.wardId === admitForm.wardId;
    }
    return isAvail;
  });

  const handleOpenAdmitWithBed = (bed: Bed) => {
    setAdmitForm((prev) => ({
      ...prev,
      wardId: bed.wardId,
      bedId: bed.id,
    }));
    setIsAdmitModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patientId || !admitForm.bedId) {
      dispatch(
        addToast({
          type: "error",
          title: "Incomplete Admission",
          message: "Please choose both a patient and an available bed",
        }),
      );
      return;
    }
    try {
      await createAdmission({
        patientId: admitForm.patientId,
        bedId: admitForm.bedId,
        admissionReason: admitForm.admissionReason,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Patient Admitted",
          message: "Inpatient admission registered and bed allocated",
        }),
      );
      setIsAdmitModalOpen(false);
      setAdmitForm({
        patientId: "",
        wardId: "",
        bedId: "",
        admissionReason: "Observation & Inpatient Medical Management",
      });
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Admission creation failed";
      dispatch(
        addToast({
          type: "error",
          title: "Admission Failed",
          message: errorMsg || "Error occurred",
        }),
      );
    }
  };

  const handleConfirmDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTarget) return;
    try {
      await dischargePatient({
        id: dischargeTarget.id,
        dischargeDisposition: dischargeForm.disposition,
        dischargeNotes: dischargeForm.notes,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Patient Discharged",
          message: "Discharge disposition recorded. Bed freed for sanitation.",
        }),
      );
      setDischargeTarget(null);
      setDischargeForm({ disposition: "HOME", notes: "" });
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Discharge failed";
      dispatch(
        addToast({
          type: "error",
          title: "Discharge Failed",
          message: errorMsg || "Error occurred",
        }),
      );
    }
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !transferToBedId) return;
    try {
      await transferBed({
        id: transferTarget.admissionId,
        fromBedId: transferTarget.fromBedId,
        toBedId: transferToBedId,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Bed Transferred",
          message: "Patient transferred to newly assigned bed",
        }),
      );
      setTransferTarget(null);
      setTransferToBedId("");
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Unable to transfer bed";
      dispatch(
        addToast({
          type: "error",
          title: "Transfer Failed",
          message: errorMsg || "Unable to transfer bed",
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inpatient Wards & Bed Occupancy"
        description="Ward telemetry, visual bed layout, patient hospitalizations, and discharges"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
              <button
                onClick={() => setViewMode("matrix")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors",
                  viewMode === "matrix"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
                title="Visual Bed Matrix"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Bed Map</span>
              </button>
              <button
                onClick={() => setViewMode("roster")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors",
                  viewMode === "roster"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
                title="Inpatient Roster"
              >
                <List size={13} />
                <span className="hidden sm:inline">Roster</span>
              </button>
            </div>

            <button
              onClick={() => setIsAdmitModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
            >
              <Plus size={15} />
              <span>Admit Patient</span>
            </button>
          </div>
        }
      />

      {/* Ward Status Overview KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DoorOpen size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {wards.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Hospital Wards
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BedIcon size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {beds.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Total Beds
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <User size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {activeAdmissions.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Admitted Inpatients
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            {occupancyPercent}%
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-tight">
              {occupancyPercent}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Bed Occupancy
            </div>
          </div>
        </div>
      </div>

      {/* Ward Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            Ward:
          </span>
          <button
            onClick={() => setSelectedWardFilter("ALL")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
              selectedWardFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            All Wards ({wards.length})
          </button>
          {wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWardFilter(w.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                selectedWardFilter === w.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {w.name}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock text="Loading inpatient ward telemetry…" />
      ) : viewMode === "matrix" ? (
        /* ─── VISUAL BED MATRIX VIEW ─── */
        <div className="space-y-6">
          {displayedWards.map((ward) => {
            const wardBeds = beds.filter((b) => b.wardId === ward.id);
            const occupiedInWard = wardBeds.filter(
              (b) => b.status === "OCCUPIED",
            ).length;

            return (
              <div
                key={ward.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Ward Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100/60 text-blue-700 rounded-lg">
                      <DoorOpen size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {ward.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Code: {ward.code} • Type: {ward.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      <strong>{occupiedInWard}</strong> of {wardBeds.length} beds
                      occupied
                    </span>
                    <Badge
                      variant={
                        occupiedInWard === wardBeds.length
                          ? "danger"
                          : occupiedInWard > 0
                            ? "warning"
                            : "success"
                      }
                    >
                      {wardBeds.length > 0
                        ? `${Math.round((occupiedInWard / wardBeds.length) * 100)}% Occupied`
                        : "0%"}
                    </Badge>
                  </div>
                </div>

                {/* Bed Grid for this ward */}
                <div className="p-5">
                  {wardBeds.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {wardBeds.map((bed) => {
                        const bedNumberDisplay =
                          bed.bedNumber || (bed as any).bedNo || "Bed";
                        const isOccupied = bed.status === "OCCUPIED";
                        const isAvailable = bed.status === "AVAILABLE";

                        // Find admission on this bed if any
                        const admissionOnBed = admissions.find(
                          (a) => a.bedId === bed.id && a.status === "ADMITTED",
                        );

                        return (
                          <div
                            key={bed.id}
                            className={cn(
                              "p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 relative group",
                              isAvailable
                                ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:shadow-xs"
                                : isOccupied
                                  ? "bg-rose-50/40 border-rose-200 hover:border-rose-400 shadow-xs"
                                  : "bg-slate-50 border-slate-200",
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  <BedIcon
                                    size={14}
                                    className={
                                      isAvailable
                                        ? "text-emerald-600"
                                        : isOccupied
                                          ? "text-rose-600"
                                          : "text-slate-400"
                                    }
                                  />
                                  {bedNumberDisplay}
                                </span>
                                <span
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    isAvailable
                                      ? "bg-emerald-500 animate-pulse"
                                      : isOccupied
                                        ? "bg-rose-500"
                                        : "bg-amber-400",
                                  )}
                                />
                              </div>

                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {bed.type || "Standard Bed"}
                              </span>

                              {isOccupied && admissionOnBed && (
                                <div className="mt-2 pt-1.5 border-t border-rose-100 text-[11px]">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {admissionOnBed.patientName ||
                                      `Pt: ${admissionOnBed.patientId.slice(0, 6)}`}
                                  </p>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {admissionOnBed.admissionReason || "Admitted"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Bed Actions */}
                            <div className="pt-1">
                              {isAvailable ? (
                                <button
                                  onClick={() => handleOpenAdmitWithBed(bed)}
                                  className="w-full py-1 text-[11px] font-semibold text-emerald-700 bg-white hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors shadow-xs"
                                >
                                  + Admit
                                </button>
                              ) : isOccupied && admissionOnBed ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      setTransferTarget({
                                        admissionId: admissionOnBed.id,
                                        fromBedId: bed.id,
                                        patientName: admissionOnBed.patientName,
                                      })
                                    }
                                    className="flex-1 py-1 text-[10px] font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                                    title="Transfer Bed"
                                  >
                                    Move
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDischargeTarget({
                                        id: admissionOnBed.id,
                                        patientName: admissionOnBed.patientName,
                                      })
                                    }
                                    className="flex-1 py-1 text-[10px] font-semibold text-rose-700 bg-white hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                                    title="Discharge Patient"
                                  >
                                    Exit
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No beds configured in this ward.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── INPATIENT ROSTER VIEW ─── */
        admissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {admissions.map((adm) => (
              <div
                key={adm.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {adm.admissionNo}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={11} /> Admitted:{" "}
                        {formatDateTime(adm.admittedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        adm.status === "ADMITTED" ? "warning" : "success"
                      }
                    >
                      {adm.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Patient
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {adm.patientName || `Patient: ${adm.patientId.slice(0, 8)}`}
                    </h4>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-semibold text-slate-800">
                        {adm.wardName || "Ward"} • Bed {adm.bedNo || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Diagnosis:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {adm.admissionReason || "Observation"}
                      </span>
                    </div>
                  </div>
                </div>

                {adm.status === "ADMITTED" && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() =>
                        setTransferTarget({
                          admissionId: adm.id,
                          fromBedId: adm.bedId,
                          patientName: adm.patientName,
                        })
                      }
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ArrowRightLeft size={13} />
                      Transfer
                    </button>
                    <button
                      onClick={() =>
                        setDischargeTarget({
                          id: adm.id,
                          patientName: adm.patientName,
                        })
                      }
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <LogOut size={13} />
                      Discharge
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No admitted patients"
            description="All ward beds are vacant. Use 'Admit Patient' to register an inpatient."
          />
        )
      )}

      {/* ─── ADMISSION MODAL ─── */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hospitalize / Admit Patient
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign an available inpatient ward bed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdmitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={admitForm.patientId}
                  onChange={(e) =>
                    setAdmitForm({ ...admitForm, patientId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose registered patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ward *
                  </label>
                  <select
                    required
                    value={admitForm.wardId}
                    onChange={(e) =>
                      setAdmitForm({
                        ...admitForm,
                        wardId: e.target.value,
                        bedId: "",
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                  >
                    <option value="">-- Select Ward --</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Available Bed *
                  </label>
                  <select
                    required
                    value={admitForm.bedId}
                    onChange={(e) =>
                      setAdmitForm({ ...admitForm, bedId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                  >
                    <option value="">-- Select Bed --</option>
                    {availableBedsForForm.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber || (b as any).bedNo || b.id.slice(0, 8)} (
                        {b.type || "Bed"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Admission / Clinical Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={admitForm.admissionReason}
                  onChange={(e) =>
                    setAdmitForm({
                      ...admitForm,
                      admissionReason: e.target.value,
                    })
                  }
                  placeholder="e.g. Severe hydration deficit, post-surgical observation..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <Spinner size={14} className="text-white" />
                      <span>Allocating…</span>
                    </>
                  ) : (
                    <span>Confirm Admission</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DISCHARGE MODAL ─── */}
      {dischargeTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmDischarge}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Discharge Inpatient
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Release patient and free assigned hospital bed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDischargeTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Discharge Disposition
              </label>
              <select
                value={dischargeForm.disposition}
                onChange={(e) =>
                  setDischargeForm({
                    ...dischargeForm,
                    disposition: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="HOME">Discharged to Home (Routine)</option>
                <option value="TRANSFERRED">
                  Transferred to Specialized Facility
                </option>
                <option value="AGAINST_MEDICAL_ADVICE">
                  Left Against Medical Advice (AMA)
                </option>
                <option value="DECEASED">Deceased</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Discharge Summary & Instructions
              </label>
              <textarea
                rows={3}
                value={dischargeForm.notes}
                onChange={(e) =>
                  setDischargeForm({
                    ...dischargeForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Prescription instructions, follow-up schedule in 7 days..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDischargeTarget(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDischarging}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isDischarging ? (
                  <>
                    <Spinner size={14} className="text-white" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>Confirm Discharge</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TRANSFER BED MODAL ─── */}
      {transferTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmTransfer}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transfer Patient Bed
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reassign {transferTarget.patientName || "Patient"} to another
                  available bed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Destination Bed *
              </label>
              <select
                required
                value={transferToBedId}
                onChange={(e) => setTransferToBedId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">-- Choose vacant bed --</option>
                {beds
                  .filter((b) => b.status === "AVAILABLE")
                  .map((b) => {
                    const ward = wards.find((w) => w.id === b.wardId);
                    return (
                      <option key={b.id} value={b.id}>
                        {ward?.name || "Ward"} •{" "}
                        {b.bedNumber || (b as any).bedNo || b.id.slice(0, 8)} (
                        {b.type || "Bed"})
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!transferToBedId || isTransferring}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isTransferring ? (
                  <>
                    <Spinner size={14} className="text-white" />
                    <span>Transferring…</span>
                  </>
                ) : (
                  <span>Execute Transfer</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
