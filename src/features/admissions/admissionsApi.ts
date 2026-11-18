import { baseApi } from "../api/baseApi";

export interface Ward {
  id: string;
  name: string;
  code: string;
  type: string;
  genderRestriction?: string;
  capacity?: number;
}

export interface Bed {
  id: string;
  wardId: string;
  roomId?: string;
  bedNumber: string;
  type: string;
  status: string;
}

export interface Admission {
  id: string;
  admissionNo: string;
  patientId: string;
  wardId?: string;
  bedId?: string;
  admittedAt: string;
  dischargedAt?: string;
  status: string;
  admissionReason?: string;
  dischargeDisposition?: string;
}

export const admissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmissions: builder.query<{ success: boolean; data: Admission[] }, { status?: string }>({
      query: (params) => ({ url: "/admissions", params }),
      providesTags: ["Admission"],
    }),

    createAdmission: builder.mutation<{ success: boolean; data: Admission }, Partial<Admission>>({
      query: (body) => ({ url: "/admissions", method: "POST", body }),
      invalidatesTags: ["Admission"],
    }),

    dischargePatient: builder.mutation<
      { success: boolean; data: Admission },
      { id: string; dischargeDisposition?: string; dischargeNotes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admissions/${id}/discharge`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admission"],
    }),

    getWards: builder.query<{ success: boolean; data: Ward[] }, void>({
      query: () => "/wards",
      providesTags: ["Admission"],
    }),

    getBeds: builder.query<{ success: boolean; data: Bed[] }, { wardId?: string; status?: string }>({
      query: (params) => ({ url: "/wards/beds", params }),
      providesTags: ["Admission"],
    }),

    createWard: builder.mutation<{ success: boolean; data: Ward }, Partial<Ward>>({
      query: (body) => ({ url: "/wards", method: "POST", body }),
      invalidatesTags: ["Admission"],
    }),
  }),
});

export const {
  useGetAdmissionsQuery,
  useCreateAdmissionMutation,
  useDischargePatientMutation,
  useGetWardsQuery,
  useGetBedsQuery,
  useCreateWardMutation,
} = admissionsApi;
