import { baseApi } from "../api/baseApi";

export interface Encounter {
  id: string;
  encounterNo: string;
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  departmentId?: string;
  type: string;
  status: string;
  chiefComplaint?: string;
  startAt: string;
  endAt?: string;
  createdAt: string;
  patientName?: string;
  doctorName?: string;
}

export interface ClinicalNote {
  id: string;
  encounterId: string;
  authorId: string;
  noteType: string;
  content: string;
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  encounterId: string;
  icdCode?: string;
  description: string;
  type: string;
  createdAt: string;
}

export const encountersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEncounters: builder.query<
      { success: boolean; data: Encounter[] },
      { status?: string; type?: string }
    >({
      query: (params) => ({ url: "/encounters", params }),
      providesTags: ["Encounter"],
    }),

    getEncounter: builder.query<
      { success: boolean; data: Encounter },
      string
    >({
      query: (id) => `/encounters/${id}`,
      providesTags: ["Encounter"],
    }),

    createEncounter: builder.mutation<
      { success: boolean; data: Encounter },
      Partial<Encounter>
    >({
      query: (body) => ({ url: "/encounters", method: "POST", body }),
      invalidatesTags: ["Encounter", "Appointment"],
    }),

    updateEncounterStatus: builder.mutation<
      { success: boolean; data: Encounter },
      { id: string; status: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/encounters/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Encounter"],
    }),

    getEncounterNotes: builder.query<
      { success: boolean; data: ClinicalNote[] },
      string
    >({
      query: (id) => `/encounters/${id}/notes`,
      providesTags: ["Encounter"],
    }),

    addClinicalNote: builder.mutation<
      { success: boolean; data: ClinicalNote },
      { encounterId: string; noteType: string; content: string }
    >({
      query: ({ encounterId, ...body }) => ({
        url: `/encounters/${encounterId}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Encounter"],
    }),

    getEncounterDiagnoses: builder.query<
      { success: boolean; data: Diagnosis[] },
      string
    >({
      query: (id) => `/encounters/${id}/diagnoses`,
      providesTags: ["Encounter"],
    }),

    addDiagnosis: builder.mutation<
      { success: boolean; data: Diagnosis },
      { encounterId: string; icdCode?: string; description: string; type: string }
    >({
      query: ({ encounterId, ...body }) => ({
        url: `/encounters/${encounterId}/diagnoses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Encounter"],
    }),
  }),
});

export const {
  useGetEncountersQuery,
  useGetEncounterQuery,
  useCreateEncounterMutation,
  useUpdateEncounterStatusMutation,
  useGetEncounterNotesQuery,
  useAddClinicalNoteMutation,
  useGetEncounterDiagnosesQuery,
  useAddDiagnosisMutation,
} = encountersApi;
