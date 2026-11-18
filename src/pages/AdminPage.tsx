import React, { useState } from "react";
import { Search, ShieldCheck, Plus, X } from "lucide-react";
import { useGetUsersQuery, useUpdateUserMutation, useGetRolesQuery, useAssignUserRoleMutation, useCreateUserMutation } from "../features/auth/authApi";
import { EmptyState, LoadingBlock, PageHeader } from "../components/ui/shared";

export const AdminPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useGetUsersQuery({ search: search || undefined });
  const [updateUser] = useUpdateUserMutation();
  const { data: rolesData } = useGetRolesQuery();
  const [assignUserRole] = useAssignUserRoleMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", username: "", role: "" });
  const users = data?.data || [];
  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    await createUser({ ...form, role: form.role || undefined }).unwrap();
    setIsModalOpen(false);
    setForm({ email: "", password: "", firstName: "", lastName: "", username: "", role: "" });
  };

  if (isLoading) return <LoadingBlock text="Loading users…" />;
  if (isError) return <EmptyState icon={<ShieldCheck size={36} />} title="Administration unavailable" description="Only administrators can manage staff accounts." />;

  return <div className="space-y-5">
    <PageHeader title="Administration" description="Manage hospital staff account status" actions={<button onClick={() => setIsModalOpen(true)} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"><Plus size={15} className="mr-1 inline" />Add Staff</button>} />
    <div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff by name or email…" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm" /></div>
    {users.length === 0 ? <EmptyState icon={<ShieldCheck size={36} />} title="No staff found" description="No staff accounts match your search." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Current roles</th><th className="px-4 py-3">Assign role</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{user.firstName} {user.lastName}</td><td className="px-4 py-3 text-slate-500">{user.email}</td><td className="px-4 py-3">{user.status}</td><td className="px-4 py-3 text-xs text-slate-600">{user.roles?.join(", ") || "STAFF"}</td><td className="px-4 py-3"><select defaultValue="" onChange={(e) => e.target.value && assignUserRole({ userId: user.id, roleId: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1 text-xs"><option value="">Assign role</option>{(rolesData?.data || []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></td><td className="px-4 py-3"><button onClick={() => updateUser({ id: user.id, status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{user.status === "ACTIVE" ? "Disable" : "Enable"}</button></td></tr>)}</tbody></table></div>}
    {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={handleCreate} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="font-bold">Add Staff Account</h3><button type="button" onClick={() => setIsModalOpen(false)}><X size={18} /></button></div><div className="grid grid-cols-2 gap-2"><input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" /><input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" /></div><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" /><input required type="password" minLength={6} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">Default staff role</option>{(rolesData?.data || []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button disabled={isCreating} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isCreating ? "Creating…" : "Create Staff"}</button></form></div>}
  </div>;
};
