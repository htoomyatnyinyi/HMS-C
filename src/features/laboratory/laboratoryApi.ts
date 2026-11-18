import { baseApi } from "../api/baseApi";

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string;
  specimenType?: string;
  price?: number;
}

export interface LabOrder {
  id: string;
  orderNo: string;
  patientId: string;
  encounterId?: string;
  priority: string;
  status: string;
  clinicalNotes?: string;
  createdAt: string;
}

export const laboratoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabTests: builder.query<{ success: boolean; data: LabTest[] }, { category?: string }>({
      query: (params) => ({ url: "/laboratory/tests", params }),
      providesTags: ["Encounter"],
    }),

    getLabOrders: builder.query<{ success: boolean; data: LabOrder[] }, { status?: string }>({
      query: (params) => ({ url: "/laboratory/orders", params }),
      providesTags: ["Encounter"],
    }),

    createLabOrder: builder.mutation<{ success: boolean; data: LabOrder }, Partial<LabOrder>>({
      query: (body) => ({ url: "/laboratory/orders", method: "POST", body }),
      invalidatesTags: ["Encounter"],
    }),
  }),
});

export const { useGetLabTestsQuery, useGetLabOrdersQuery, useCreateLabOrderMutation } = laboratoryApi;
