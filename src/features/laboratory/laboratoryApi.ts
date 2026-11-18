import { baseApi } from "../api/baseApi";

export interface LabTest {
  id: string;
  laboratoryId: string;
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
  items?: LabOrderItem[];
}

export interface LabOrderItem {
  id: string;
  labTestId: string;
  status: string;
  specimen?: { accessionNo: string; specimenType: string; collectedAt?: string };
  result?: { valueText?: string; valueNumber?: number; unit?: string; referenceRange?: string; abnormalFlag?: string; remarks?: string; resultedAt?: string };
}

export interface CreateLabOrderInput {
  laboratoryId: string;
  patientId: string;
  encounterId?: string;
  testIds: string[];
  priority?: string;
  notes?: string;
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
    getLabOrder: builder.query<{ success: boolean; data: LabOrder }, string>({
      query: (id) => `/laboratory/orders/${id}`,
      providesTags: ["Encounter"],
    }),

    createLabOrder: builder.mutation<{ success: boolean; data: LabOrder }, CreateLabOrderInput>({
      query: (body) => ({ url: "/laboratory/orders", method: "POST", body }),
      invalidatesTags: ["Encounter"],
    }),
    collectSpecimen: builder.mutation<{ success: boolean; data: unknown }, { orderItemId: string; specimenType: string }>({
      query: ({ orderItemId, ...body }) => ({ url: `/laboratory/orders/${orderItemId}/specimens`, method: "POST", body }),
      invalidatesTags: ["Encounter"],
    }),
    submitLabResult: builder.mutation<{ success: boolean; data: unknown }, { orderItemId: string; valueText: string; unit?: string; referenceRange?: string; abnormalFlag?: string; remarks?: string }>({
      query: ({ orderItemId, ...body }) => ({ url: "/laboratory/results", method: "POST", body: { orderItemId, ...body } }),
      invalidatesTags: ["Encounter"],
    }),
  }),
});

export const { useGetLabTestsQuery, useGetLabOrdersQuery, useGetLabOrderQuery, useCreateLabOrderMutation, useCollectSpecimenMutation, useSubmitLabResultMutation } = laboratoryApi;
