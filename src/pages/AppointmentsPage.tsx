import React from "react";
import { Clock, CalendarCheck, Plus } from "lucide-react";
import {
  useGetAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
} from "../features/appointments/appointmentsApi";
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

  const appointments = data?.data || [];

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
          <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20">
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
    </div>
  );
};
