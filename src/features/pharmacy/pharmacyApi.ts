import { baseApi } from "../api/baseApi";

export interface Medicine {
  id: string;
  pharmacyId: string;
  code: string;
  name: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  unit: string;
}

export interface CreateMedicineInput {
  pharmacyId?: string;
  code: string;
  name: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  unit?: string;
}

export interface CreateDispensationInput {
  pharmacyId?: string;
  prescriptionId: string;
  items: Array<{ prescriptionItemId: string; quantity: number }>;
}

export const pharmacyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMedicines: builder.query<{ success: boolean; data: Medicine[] }, { search?: string }>({
      query: (params) => ({
        url: "/pharmacy/medicines",
        params,
      }),
      providesTags: ["Medicine"],
    }),
    createMedicine: builder.mutation<{ success: boolean; data: Medicine }, CreateMedicineInput>({
      query: (body) => ({ url: "/pharmacy/medicines", method: "POST", body }),
      invalidatesTags: ["Medicine"],
    }),
    createDispensation: builder.mutation<{ success: boolean; data: unknown }, CreateDispensationInput>({
      query: (body) => ({ url: "/pharmacy/dispensations", method: "POST", body }),
      invalidatesTags: ["Medicine"],
    }),
  }),
});

export const { useGetMedicinesQuery, useCreateMedicineMutation, useCreateDispensationMutation } = pharmacyApi;
