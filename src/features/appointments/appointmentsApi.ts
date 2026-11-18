import { baseApi } from "../api/baseApi";

export interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  doctorId?: string;
  startAt: string;
  endAt: string;
  status: string;
  reason?: string;
  patientName?: string;
  doctorName?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId?: string;
  departmentId?: string;
  startAt: string;
  endAt: string;
  reason?: string;
  notes?: string;
}

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query<{ success: boolean; data: Appointment[] }, { date?: string; status?: string }>({
      query: (params) => ({
        url: "/appointments",
        params,
      }),
      providesTags: ["Appointment"],
    }),
    createAppointment: builder.mutation<
      { success: boolean; data: Appointment },
      CreateAppointmentInput
    >({
      query: (body) => ({ url: "/appointments", method: "POST", body }),
      invalidatesTags: ["Appointment"],
    }),
    updateAppointmentStatus: builder.mutation<
      { success: boolean; data: Appointment },
      { id: string; status: string; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/appointments/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Appointment"],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
} = appointmentsApi;
