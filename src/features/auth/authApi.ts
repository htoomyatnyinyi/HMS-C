import { baseApi } from "../api/baseApi";
import type { User } from "./authSlice";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
  };
  error?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDoctors: builder.query<{ success: boolean; data: Array<{ id: string; qualification?: string }> }, void>({
      query: () => "/auth/doctors",
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    getMe: builder.query<{ success: boolean; data: User }, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery, useGetDoctorsQuery } = authApi;
