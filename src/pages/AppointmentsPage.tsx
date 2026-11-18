import React, { useState } from "react";
import {
  Clock,
  CalendarCheck,
  Plus,
  X,
  User,
  Stethoscope,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  ListFilter,
  Check,
} from "lucide-react";
import {
  useGetAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
  useCreateAppointmentMutation,
  type Appointment,
} from "../features/appointments/appointmentsApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useGetDoctorsQuery } from "../features/auth/authApi";
import {
  LoadingBlock,
  EmptyState,
  PageHeader,
  Badge,
  Spinner,
} from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";

const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "info" | "neutral" | "danger";
    label: string;
  }
> = {
  COMPLETED: { variant: "success", label: "Completed" },
  CONFIRMED: { variant: "info", label: "Confirmed" },
  BOOKED: { variant: "info", label: "Booked" },
  CHECKED_IN: { variant: "warning", label: "Checked In" },
  IN_CONSULTATION: { variant: "warning", label: "In Consultation" },
  CANCELLED: { variant: "danger", label: "Cancelled" },
  NO_SHOW: { variant: "neutral", label: "No Show" },
};

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const AppointmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  const { data, isLoading, refetch } = useGetAppointmentsQuery({
    date: selectedDate,
  });
  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [createAppointment, { isLoading: isCreating }] =
    useCreateAppointmentMutation();

  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const { data: doctorsData } = useGetDoctorsQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: todayStr,
    startTime: "09:00",
    durationMinutes: 30,
    reason: "General Consultation",
    notes: "",
  });

  const appointments: Appointment[] = data?.data || [];
  const patients = patientsData?.data?.data || [];
  const doctors = doctorsData?.data || [];

  // Filtered by status
  const filteredAppointments =
    statusFilter === "ALL"
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  // Statistics
  const totalCount = appointments.length;
  const waitingCount = appointments.filter(
    (a) => a.status === "CHECKED_IN" || a.status === "BOOKED",
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "COMPLETED",
  ).length;
  const cancelledCount = appointments.filter(
    (a) => a.status === "CANCELLED" || a.status === "NO_SHOW",
  ).length;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.patientId) {
      dispatch(
        addToast({
          type: "error",
          title: "Patient Required",
          message: "Please select a patient to book the appointment",
        }),
      );
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(start.getTime() + form.durationMinutes * 60 * 1000);

    try {
      await createAppointment({
        patientId: form.patientId,
        doctorId: form.doctorId || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        reason: form.reason,
        notes: form.notes || undefined,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Appointment Scheduled",
          message: `Consultation reserved for ${form.date} at ${form.startTime}`,
        }),
      );

      setIsModalOpen(false);
      setForm({
        patientId: "",
        doctorId: "",
        date: form.date,
        startTime: "09:00",
        durationMinutes: 30,
        reason: "General Consultation",
        notes: "",
      });
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to schedule appointment";
      dispatch(
        addToast({
          type: "error",
          title: "Booking Failed",
          message: errorMsg || "Failed to schedule appointment",
        }),
      );
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Status Updated",
          message: `Appointment marked as ${newStatus.replace("_", " ")}`,
        }),
      );
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to update appointment status";
      dispatch(
        addToast({
          type: "error",
          title: "Action Failed",
          message: errorMsg || "Failed to update appointment status",
        }),
      );
    }
  };

  // Helper to open modal on specific time slot
  const openBookingForSlot = (slotTime: string) => {
    setForm((prev) => ({
      ...prev,
      date: selectedDate,
      startTime: slotTime,
    }));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Clinical Appointment Schedule"
        description="Doctor consult schedules, outpatient queues, and check-ins"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
                title="Grid view"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors",
                  viewMode === "timeline"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
                title="Timeline schedule"
              >
                <Clock size={13} />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
            >
              <Plus size={15} />
              <span>Book Appointment</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CalendarIcon size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Total Today
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {waitingCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Waiting Queue
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {completedCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Completed
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {cancelledCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Cancelled / Missed
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation & Status Filter Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              selectedDate === todayStr
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            Today
          </button>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <CalendarIcon size={14} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 font-medium text-slate-800 focus:outline-none text-xs"
            />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden lg:inline">
            <ListFilter size={13} className="inline mr-1" />
            Filter:
          </span>
          {[
            { id: "ALL", label: "All" },
            { id: "CHECKED_IN", label: "Checked In" },
            { id: "BOOKED", label: "Booked" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                statusFilter === item.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingBlock text="Loading clinical appointments…" />
      ) : viewMode === "grid" ? (
        /* ─── GRID VIEW ─── */
        filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAppointments.map((a) => {
              const cfg = statusConfig[a.status] || {
                variant: "neutral" as const,
                label: a.status,
              };
              const isFinished =
                a.status === "COMPLETED" ||
                a.status === "CANCELLED" ||
                a.status === "NO_SHOW";
              return (
                <div
                  key={a.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                        {a.appointmentNo}
                      </span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>

                    {/* Time & Reason */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Clock size={13} className="text-slate-400" />
                        <span>{formatDateTime(a.startAt)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {a.reason || "General Consultation"}
                      </h4>
                    </div>

                    {/* Patient & Doctor details */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <User size={13} className="text-slate-400" />
                        <span className="font-semibold">
                          {a.patientName || `Patient: ${a.patientId.slice(0, 8)}`}
                        </span>
                      </div>
                      {a.doctorName && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Stethoscope size={13} className="text-slate-400" />
                          <span>Dr. {a.doctorName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {!isFinished && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      {a.status !== "CHECKED_IN" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "CHECKED_IN")}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <CalendarCheck size={13} />
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(a.id, "COMPLETED")}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={13} />
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(a.id, "CANCELLED")}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No appointments found"
            description="No scheduled appointments match the selected date and filter."
          />
        )
      ) : (
        /* ─── TIMELINE SCHEDULE VIEW ─── */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {TIME_SLOTS.map((slot) => {
            const slotAppointments = appointments.filter((a) => {
              const apptHour = new Date(a.startAt)
                .toLocaleTimeString("en-US", { hour12: false, hour: "2-digit" });
              return apptHour.startsWith(slot.slice(0, 2));
            });

            return (
              <div
                key={slot}
                className="p-4 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* Time Indicator */}
                <div className="sm:w-24 flex-shrink-0 flex items-center sm:flex-col sm:items-start gap-1">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {slot}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {Number(slot.slice(0, 2)) < 12 ? "AM Slot" : "PM Slot"}
                  </span>
                </div>

                {/* Slot Content */}
                <div className="flex-1 space-y-2">
                  {slotAppointments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {slotAppointments.map((appt) => {
                        const cfg = statusConfig[appt.status] || {
                          variant: "neutral" as const,
                          label: appt.status,
                        };
                        return (
                          <div
                            key={appt.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-slate-900">
                                  {appt.patientName || "Patient Record"}
                                </span>
                                <Badge variant={cfg.variant}>
                                  {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {appt.reason || "Consultation"}
                              </p>
                            </div>
                            {appt.status !== "COMPLETED" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(appt.id, "COMPLETED")
                                }
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                              >
                                Finish
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-1 text-xs text-slate-400">
                      <span className="italic">No appointments scheduled</span>
                      <button
                        onClick={() => openBookingForSlot(slot)}
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Plus size={12} /> Book slot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Book Clinical Appointment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Schedule an in-person or outpatient visit
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Patient Select */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Patient *
              </label>
              <select
                required
                value={form.patientId}
                onChange={(e) =>
                  setForm({ ...form, patientId: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Choose registered patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — MRN: {p.mrn} (
                    {p.phone || "No phone"})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Select */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Attending Physician (Optional)
              </label>
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Any Available Physician / Duty Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.qualification || "Physician"} (ID:{" "}
                    {doctor.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Appointment Date *
                </label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Start Time *
                </label>
                <input
                  required
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            {/* Duration Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Consultation Duration
              </label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() =>
                      setForm({ ...form, durationMinutes: mins })
                    }
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      form.durationMinutes === mins
                        ? "bg-blue-50 text-blue-700 border-blue-300 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Visit / Chief Complaint *
              </label>
              <input
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Follow-up hypertension review, persistent cough"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isCreating ? (
                  <>
                    <Spinner size={14} className="text-white" />
                    <span>Booking…</span>
                  </>
                ) : (
                  <span>Confirm Appointment</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
