import { baseApi } from "../api/baseApi";

export interface Patient {
  id: string;
  mrn: string;
  tenantId?: string;
  hospitalId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  gender: string;
  phone?: string;
  email?: string;
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

export interface PatientAllergy {
  id: string;
  substance: string;
  reaction?: string;
  severity?: string;
  status?: string;
}

export interface PatientEncounterSummary {
  id: string;
  encounterNo: string;
  status: string;
  class: string;
  type?: string;
  startedAt?: string;
  endedAt?: string;
  chiefComplaint?: string;
  doctor?: {
    firstName: string;
    lastName: string;
  };
}

export interface PatientPrescriptionSummary {
  id: string;
  prescriptionNo: string;
  status: string;
  notes?: string;
  createdAt: string;
  items?: Array<{
    id: string;
    medicineId: string;
    dose?: string;
    frequency?: string;
    durationDays?: number;
    quantity: number;
    instructions?: string;
  }>;
}

export interface PatientInvoiceSummary {
  id: string;
  invoiceNo: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: string;
}

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query<
      PatientsResponse,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/patients",
        params,
      }),
      providesTags: ["Patient"],
    }),
    getPatientById: builder.query<{ success: boolean; data: Patient }, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Patient", id }],
    }),
    createPatient: builder.mutation<
      { success: boolean; data: Patient },
      Partial<Patient>
    >({
      query: (body) => ({
        url: "/patients",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Patient"],
    }),
    updatePatient: builder.mutation<
      { success: boolean; data: Patient },
      { id: string; data: Partial<Patient> }
    >({
      query: ({ id, data }) => ({
        url: `/patients/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        "Patient",
        { type: "Patient", id },
      ],
    }),
    getPatientEncounters: builder.query<
      { success: boolean; data: PatientEncounterSummary[] },
      string
    >({
      query: (id) => `/patients/${id}/encounters`,
      providesTags: ["Encounter"],
    }),
    getPatientPrescriptions: builder.query<
      { success: boolean; data: PatientPrescriptionSummary[] },
      string
    >({
      query: (id) => `/patients/${id}/prescriptions`,
      providesTags: ["Prescription"],
    }),
    getPatientInvoices: builder.query<
      { success: boolean; data: PatientInvoiceSummary[] },
      string
    >({
      query: (id) => `/patients/${id}/invoices`,
      providesTags: ["Invoice"],
    }),
    getPatientAllergies: builder.query<
      { success: boolean; data: PatientAllergy[] },
      string
    >({
      query: (id) => `/patients/${id}/allergies`,
      providesTags: ["Patient"],
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetPatientByIdQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useGetPatientEncountersQuery,
  useGetPatientPrescriptionsQuery,
  useGetPatientInvoicesQuery,
  useGetPatientAllergiesQuery,
} = patientsApi;
