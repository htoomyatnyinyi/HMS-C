import { baseApi } from "../api/baseApi";

export interface Patient {
  id: string;
  mrn: string;
  tenantId?: string;
  hospitalId?: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface PatientsResponse {
  success: boolean;
  data: {
    data: Patient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query<PatientsResponse, { search?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/patients",
        params,
      }),
      providesTags: ["Patient"],
    }),
    createPatient: builder.mutation<{ success: boolean; data: Patient }, Partial<Patient>>({
      query: (body) => ({
        url: "/patients",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Patient"],
    }),
  }),
});

export const { useGetPatientsQuery, useCreatePatientMutation } = patientsApi;
