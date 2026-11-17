import React from "react";
import { Activity, Bell, LogOut, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
          <Activity size={18} />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-900 leading-tight">Central Health HMS</h1>
          <p className="text-[10px] text-slate-500">Care Monolith System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Bell size={18} />
        </button>

        <div className="h-5 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User size={15} />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : "Staff User"}
            </p>
            <p className="text-[10px] text-slate-500">{user?.roles?.[0] || "STAFF"}</p>
          </div>
          <button
            onClick={() => dispatch(logout())}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
