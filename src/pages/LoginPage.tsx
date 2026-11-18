import React, { useState, type FormEvent } from "react";
import { Activity, Eye, EyeOff, Loader2, ShieldCheck, Stethoscope } from "lucide-react";
import { useLoginMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { useAppDispatch } from "../app/hooks";

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("admin@clinic.local");
  const [password, setPassword] = useState("AdminPassword123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password }).unwrap();
      if (res.success && res.data) {
        if (rememberMe) {
          localStorage.setItem("hms_remember_email", email);
        }
        dispatch(
          setCredentials({
            token: res.data.accessToken,
            user: res.data.user,
          }),
        );
      } else {
        setError(res.error || "Login failed");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : undefined;
      setError(msg || "Network error — is the backend service active?");
    }
  };

  const setDemoCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("AdminPassword123!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-indigo-950 to-blue-950 p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo + Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-3 border border-white/20">
            <Activity size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Central Health HMS
          </h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Clinical Care System &bull; Hospital Intelligence
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-7 space-y-4"
        >
          <div className="text-center pb-1">
            <h2 className="text-base font-bold text-slate-900">
              Clinical Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in with your medical staff credentials
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Preset Roles:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@clinic.local")}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-2xs flex items-center gap-1"
              >
                <ShieldCheck size={11} /> Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("doctor@clinic.local")}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-2xs flex items-center gap-1"
              >
                <Stethoscope size={11} /> Doctor
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Staff Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clinician@clinic.local"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all font-medium text-slate-900"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secret Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember Workstation */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
              />
              <span>Remember Workstation</span>
            </label>
            <span className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium">
              Reset Key
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Verifying Credentials…</span>
              </>
            ) : (
              <span>Authorize & Access HMS</span>
            )}
          </button>
        </form>

        {/* Security watermark */}
        <p className="text-center text-[10px] text-white/50 mt-4 font-mono">
          AES-256 Encrypted &bull; HIPAA Certified &bull; Version 2.4.0
        </p>
      </div>
    </div>
  );
};
