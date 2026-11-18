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
    getRoles: builder.query<{ success: boolean; data: Array<{ id: string; name: string }> }, void>({
      query: () => "/auth/roles",
      providesTags: ["Auth"],
    }),
    assignUserRole: builder.mutation<{ success: boolean; data: unknown }, { userId: string; roleId: string }>({
      query: ({ userId, roleId }) => ({ url: `/auth/users/${userId}/roles`, method: "POST", body: { roleId } }),
      invalidatesTags: ["Auth"],
    }),
    getUsers: builder.query<{ success: boolean; data: User[] }, { search?: string }>({
      query: (params) => ({ url: "/auth/users", params }),
      providesTags: ["Auth"],
    }),
    createUser: builder.mutation<{ success: boolean; data: User }, { email: string; password: string; firstName: string; lastName: string; username?: string; phone?: string; role?: string }>({
      query: (body) => ({ url: "/auth/users", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    updateUser: builder.mutation<{ success: boolean; data: User }, { id: string; status?: string; firstName?: string; lastName?: string; phone?: string }>({
      query: ({ id, ...body }) => ({ url: `/auth/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Auth"],
    }),
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

export const { useLoginMutation, useGetMeQuery, useGetDoctorsQuery, useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useGetRolesQuery, useAssignUserRoleMutation } = authApi;
