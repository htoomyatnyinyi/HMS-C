import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  Plus,
  X,
  UserCheck,
  UserX,
  History,
  Lock,
} from "lucide-react";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useGetRolesQuery,
  useAssignUserRoleMutation,
  useCreateUserMutation,
  useGetAuditLogsQuery,
} from "../features/auth/authApi";
import type { User } from "../features/auth/authSlice";
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  Badge,
  Spinner,
} from "../components/ui/shared";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import { formatDateTime, cn } from "../lib/utils";

export const AdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useGetUsersQuery({
    search: search || undefined,
  });
  const [updateUser] = useUpdateUserMutation();
  const { data: rolesData } = useGetRolesQuery();
  const [assignUserRole] = useAssignUserRoleMutation();
  const { data: auditData } = useGetAuditLogsQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    username: "",
    role: "",
  });

  const users: User[] = data?.data || [];
  const roles = rolesData?.data || [];
  const auditLogs = auditData?.data || [];

  const activeUsersCount = users.filter((u) => u.status === "ACTIVE").length;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createUser({
        ...form,
        role: form.role || undefined,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Staff Account Created",
          message: `${form.firstName} ${form.lastName} enrolled with credentials`,
        }),
      );

      setIsModalOpen(false);
      setForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        username: "",
        role: "",
      });
      refetch();
    } catch (error: unknown) {
      const errorMsg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Failed to create staff account";
      dispatch(
        addToast({
          type: "error",
          title: "Account Creation Failed",
          message: errorMsg || "Error occurred creating account",
        }),
      );
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updateUser({ id: user.id, status: newStatus }).unwrap();
      dispatch(
        addToast({
          type: "info",
          title: "Status Changed",
          message: `${user.firstName} ${user.lastName} marked as ${newStatus}`,
        }),
      );
      refetch();
    } catch (error: unknown) {
      const errorMsg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Status update failed";
      dispatch(
        addToast({
          type: "error",
          title: "Action Failed",
          message: errorMsg || "Failed to update status",
        }),
      );
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!roleId) return;
    try {
      await assignUserRole({ userId, roleId }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Role Assigned",
          message: "User permissions updated successfully",
        }),
      );
      refetch();
    } catch (error: unknown) {
      const errorMsg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Role assignment failed";
      dispatch(
        addToast({
          type: "error",
          title: "Assignment Failed",
          message: errorMsg || "Failed to assign role",
        }),
      );
    }
  };

  if (isLoading) return <LoadingBlock text="Loading staff directory & roles…" />;
  if (isError)
    return (
      <EmptyState
        icon={<ShieldCheck size={36} />}
        title="Administration Access Restricted"
        description="Only system administrators can access staff security settings."
      />
    );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Hospital Administration & RBAC"
        description="Staff credential management, role-based access control, and compliance audit trail"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
          >
            <Plus size={15} />
            <span>Add Staff Member</span>
          </button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {users.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Registered Staff
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-tight">
              {activeUsersCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Active Logins
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Lock size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-purple-700 leading-tight">
              {roles.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              RBAC Roles
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <History size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {auditLogs.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Audit Events
            </div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or email…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs shadow-xs focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing {users.length} staff records
        </span>
      </div>

      {/* Staff Table */}
      {users.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={36} />}
          title="No staff members found"
          description="Try a different search term or add a new staff member."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Staff Member</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assigned Roles</th>
                  <th className="px-4 py-3 font-semibold">Grant Role</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isActive = u.status === "ACTIVE";
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {u.firstName?.[0] || "U"}
                            {u.lastName?.[0] || ""}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {u.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isActive ? "success" : "neutral"}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((r: string) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              STAFF
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignRole(u.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">+ Assign Role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors",
                            isActive
                              ? "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
                          )}
                        >
                          {isActive ? (
                            <>
                              <UserX size={12} />
                              Disable
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} />
                              Enable
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Security & Audit Logs Section */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Security Compliance & Audit Logs
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time Immutable Ledger
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No audit activity recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {auditLogs.slice(0, 15).map((log) => {
              const isCreate = log.action === "CREATE";
              const isDelete = log.action === "DELETE";

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded font-mono font-bold text-[10px]",
                        isCreate
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isDelete
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200",
                      )}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {log.resource}
                    </span>
                    {log.resourceId && (
                      <span className="font-mono text-slate-400 text-[11px]">
                        ({log.resourceId.slice(0, 8)})
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ADD STAFF MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md space-y-3.5 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Enroll Staff Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create hospital clinician or administrative user
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  First Name *
                </label>
                <input
                  required
                  placeholder="e.g. Zaw"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Last Name *
                </label>
                <input
                  required
                  placeholder="e.g. Min"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Hospital Email *
              </label>
              <input
                required
                type="email"
                placeholder="staff@clinic.local"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Initial Password *
              </label>
              <input
                required
                type="password"
                minLength={8}
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Initial Role Assignment
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Default Staff Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isCreating ? (
                  <>
                    <Spinner size={14} className="text-white" />
                    <span>Enrolling…</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
