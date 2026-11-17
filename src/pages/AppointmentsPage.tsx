import React from "react";
import { Clock } from "lucide-react";
import { useGetAppointmentsQuery, useUpdateAppointmentStatusMutation } from "../features/appointments/appointmentsApi";

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
      <div>
        <h2 className="text-lg md:text-xl font-bold text-slate-900">Appointments Schedule</h2>
        <p className="text-xs text-slate-500">Doctor consultations and patient check-in queue</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading appointments...
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {appointments.map((a) => (
            <div key={a.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {a.appointmentNo}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    a.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700"
                      : a.status === "CONFIRMED" || a.status === "BOOKED"
                      ? "bg-blue-100 text-blue-700"
                      : a.status === "CHECKED_IN"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {a.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock size={13} /> {new Date(a.startAt).toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{a.reason || "General Consultation"}</p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {a.status !== "CHECKED_IN" && a.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleStatusChange(a.id, "CHECKED_IN")}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold"
                  >
                    Check In
                  </button>
                )}
                {a.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleStatusChange(a.id, "COMPLETED")}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          No appointments booked for today
        </div>
      )}
    </div>
  );
};
