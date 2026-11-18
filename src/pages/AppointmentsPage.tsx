import React, { useState } from "react";
import { Clock, CalendarCheck, Plus, X } from "lucide-react";
import {
  useGetAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
  useCreateAppointmentMutation,
} from "../features/appointments/appointmentsApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useGetDoctorsQuery } from "../features/auth/authApi";
import {
  LoadingBlock,
  EmptyState,
  PageHeader,
  Badge,
} from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "info" | "neutral"; label?: string }
> = {
  COMPLETED: { variant: "success" },
  CONFIRMED: { variant: "info" },
  BOOKED: { variant: "info" },
  CHECKED_IN: { variant: "warning" },
  CANCELLED: { variant: "neutral" },
  NO_SHOW: { variant: "neutral" },
};

export const AppointmentsPage: React.FC = () => {
  const { data, isLoading } = useGetAppointmentsQuery({});
  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const { data: doctorsData } = useGetDoctorsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    reason: "General consultation",
  });

  const appointments = data?.data || [];
  const patients = patientsData?.data?.data || [];
  const doctors = doctorsData?.data || [];

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.patientId) return;
    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    try {
      await createAppointment({
        patientId: form.patientId,
        doctorId: form.doctorId || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        reason: form.reason,
      }).unwrap();
      setIsModalOpen(false);
      setForm({ patientId: "", doctorId: "", date: form.date, startTime: "09:00", reason: "General consultation" });
    } catch (error) {
      console.error("Failed to book appointment:", error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appointments Schedule"
        description="Doctor consultations and patient check-in queue"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20">
            <Plus size={15} />
            Book Appointment
          </button>
        }
      />

      {isLoading ? (
        <LoadingBlock text="Loading appointments…" />
      ) : appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {appointments.map((a) => {
            const cfg = statusConfig[a.status] || {
              variant: "neutral" as const,
            };
            return (
              <div
                key={a.id}
                className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                {/* Top row: Appt No + Status */}
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {a.appointmentNo}
                  </span>
                  <Badge variant={cfg.variant}>
                    {a.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Middle: Time + Reason */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    {formatDateTime(a.startAt)}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {a.reason || "General Consultation"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  {a.status !== "CHECKED_IN" && a.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleStatusChange(a.id, "CHECKED_IN")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50",
                      )}
                    >
                      <CalendarCheck size={13} className="inline mr-1" />
                      Check In
                    </button>
                  )}
                  {a.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleStatusChange(a.id, "COMPLETED")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50",
                      )}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarCheck size={36} />}
          title="No appointments today"
          description="All appointment slots are clear. Book a new one to get started."
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Book Appointment</h3>
              <button type="button" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.mrn}</option>)}
            </select>
            <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Any doctor</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.qualification || "Doctor"} — {doctor.id.slice(0, 8)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button disabled={isCreating} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isCreating ? "Booking…" : "Book Appointment"}</button>
          </form>
        </div>
      )}
    </div>
  );
};
