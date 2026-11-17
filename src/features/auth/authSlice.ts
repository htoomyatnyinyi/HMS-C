import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenantId?: string;
  hospitalId?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const savedToken = typeof window !== "undefined" ? localStorage.getItem("hms_token") : null;
const savedUser = typeof window !== "undefined" ? localStorage.getItem("hms_user") : null;

const initialState: AuthState = {
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  isAuthenticated: Boolean(savedToken),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem("hms_token", action.payload.token);
      localStorage.setItem("hms_user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_user");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
