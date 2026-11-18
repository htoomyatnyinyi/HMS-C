import React, { useState } from "react";
import {
  Activity,
  Bell,
  LogOut,
  User,
  Search,
  Shield,
  ChevronDown
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

interface HeaderProps {
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left — Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-white">
          <Activity size={19} strokeWidth={2.4} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm tracking-tight text-slate-900 font-sans">
              Central Health
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-md border border-blue-200/60 uppercase tracking-wider">
              HMS
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-tight">
              Clinical Core Operational
            </span>
          </div>
        </div>
      </div>

      {/* Center Search (Quick Action / Keyboard trigger hint) */}
      <div className="hidden lg:flex items-center">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200/60 text-xs transition-all w-64 shadow-xs"
        >
          <Search size={14} className="text-slate-400" />
          <span className="text-slate-400 font-normal">Search clinical files...</span>
          <kbd className="ml-auto text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right — Clinical Role & Staff Profile */}
      <div className="flex items-center gap-3">
        {/* System Notification Bell */}
        <button
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition-all border border-transparent hover:border-slate-200/60"
          title="Clinical Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200/80" />

        {/* User Profile Capsule */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-2.5 rounded-xl hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200/60 group"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-blue-100">
              {user ? (
                `${user.firstName[0]}${user.lastName[0]}`
              ) : (
                <User size={15} />
              )}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {user ? `${user.firstName} ${user.lastName}` : "Medical Staff"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={10} className="text-blue-600" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {user?.roles?.[0]?.replace("_", " ") || "STAFF"}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block group-hover:text-slate-600 transition-colors" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">
                  {user ? `${user.firstName} ${user.lastName}` : "Medical Staff"}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user?.email || "staff@clinic.local"}
                </p>
              </div>

              <div className="p-1 space-y-0.5">
                <div className="px-2.5 py-1.5 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Hospital System</span>
                  <span className="font-medium text-slate-800">CARE Monolith</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 mt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    dispatch(logout());
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
