import React from "react";
import { Activity, Bell, LogOut, User, Wifi } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { cn } from "../../lib/utils";

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <header className="h-14 border-b border-slate-200 bg-white backdrop-blur-sm px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left — Logo & System Name */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/25">
          <Activity size={17} strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <h1 className="font-bold text-sm text-slate-900 tracking-tight">
            Central Health HMS
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Wifi size={9} className="text-emerald-500" />
            <span className="text-[10px] text-slate-400 font-medium">
              System Online
            </span>
          </div>
        </div>
      </div>

      {/* Right — Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* User Pill */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 border border-blue-200/60 flex items-center justify-center text-blue-700 font-bold text-[11px]">
            {user ? (
              `${user.firstName[0]}${user.lastName[0]}`
            ) : (
              <User size={14} />
            )}
          </div>
          <div className="hidden sm:block text-left leading-none">
            <p className="text-xs font-semibold text-slate-800">
              {user ? `${user.firstName} ${user.lastName}` : "Staff User"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {user?.roles?.[0]?.replace("_", " ") || "STAFF"}
            </p>
          </div>
          <button
            onClick={() => dispatch(logout())}
            title="Sign out"
            className={cn(
              "p-1.5 rounded-lg transition-colors ml-0.5",
              "text-slate-400 hover:text-red-600 hover:bg-red-50",
            )}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
