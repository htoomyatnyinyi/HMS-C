import { baseApi } from "../api/baseApi";

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  dose?: string;
  route?: string;
  frequency?: string;
  durationDays?: number;
  quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  encounterId?: string;
  status: string;
  notes?: string;
  items?: PrescriptionItem[];
}

export interface CreatePrescriptionInput {
  patientId: string;
  encounterId: string;
  notes?: string;
  items: Array<{
    medicineId: string;
    dose?: string;
    route?: string;
    frequency?: string;
    durationDays?: number;
    quantity: number;
    instructions?: string;
  }>;
}

export const prescriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrescriptions: builder.query<{ success: boolean; data: Prescription[] }, { encounterId?: string; patientId?: string }>({
      query: (params) => ({ url: "/prescriptions", params }),
      providesTags: ["Encounter"],
    }),
    createPrescription: builder.mutation<{ success: boolean; data: Prescription }, CreatePrescriptionInput>({
      query: (body) => ({ url: "/prescriptions", method: "POST", body }),
      invalidatesTags: ["Encounter"],
    }),
  }),
});

export const { useGetPrescriptionsQuery, useCreatePrescriptionMutation } = prescriptionsApi;
