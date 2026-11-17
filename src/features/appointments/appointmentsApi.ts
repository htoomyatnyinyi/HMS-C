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

export const { useGetAppointmentsQuery, useUpdateAppointmentStatusMutation } = appointmentsApi;
