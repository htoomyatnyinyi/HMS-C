import { baseApi } from "../api/baseApi";

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  unit: string;
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
  }),
});

export const { useGetMedicinesQuery } = pharmacyApi;
