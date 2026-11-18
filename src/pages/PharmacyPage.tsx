import React, { useState } from "react";
import {
  Pill,
  Search,
  PackageCheck,
  AlertTriangle,
  Package,
  Plus,
  X,
} from "lucide-react";
import { useGetMedicinesQuery, useCreateMedicineMutation } from "../features/pharmacy/pharmacyApi";
import { useCreateDispensationMutation } from "../features/pharmacy/pharmacyApi";
import { useGetPrescriptionsQuery } from "../features/prescriptions/prescriptionsApi";
import {
  LoadingBlock,
  EmptyState,
  PageHeader,
  Badge,
} from "../components/ui/shared";

export const PharmacyPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetMedicinesQuery({ search });
  const [createMedicine, { isLoading: isCreating }] = useCreateMedicineMutation();
  const [createDispensation, { isLoading: isDispensing }] = useCreateDispensationMutation();
  const { data: prescriptionsData } = useGetPrescriptionsQuery({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", genericName: "", strength: "", dosageForm: "Tablet", unit: "tablet" });
  const [prescriptionId, setPrescriptionId] = useState("");

  const medicines = data?.data || [];
  const prescriptions = (prescriptionsData?.data || []).filter((prescription) => prescription.status === "ACTIVE" && prescription.items?.length);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createMedicine(form).unwrap();
      setIsModalOpen(false);
      setForm({ code: "", name: "", genericName: "", strength: "", dosageForm: "Tablet", unit: "tablet" });
    } catch (error) {
      console.error("Failed to create medicine:", error);
    }
  };

  const handleDispense = async () => {
    const prescription = prescriptions.find((item) => item.id === prescriptionId);
    const item = prescription?.items?.[0];
    if (!prescription || !item) return;
    try {
      await createDispensation({
        prescriptionId: prescription.id,
        items: [{ prescriptionItemId: item.id, quantity: item.quantity }],
      }).unwrap();
      setPrescriptionId("");
    } catch (error) {
      console.error("Failed to dispense prescription:", error);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pharmacy & Formulary"
        description="Medicines catalog, dosage forms, and dispensing"
        actions={<button onClick={() => setIsModalOpen(true)} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"><Plus size={15} className="mr-1 inline" />Add Medicine</button>}
      />

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine by brand or generic…"
          className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
        <div className="mr-2"><p className="text-xs font-bold text-purple-900">Dispense prescription</p><p className="text-[11px] text-purple-700">Select an active prescription for the pharmacy queue.</p></div>
        <select value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} className="min-w-64 rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs">
          <option value="">Select prescription</option>
          {prescriptions.map((prescription) => <option key={prescription.id} value={prescription.id}>{prescription.prescriptionNo} — {prescription.items?.length} item(s)</option>)}
        </select>
        <button onClick={handleDispense} disabled={!prescriptionId || isDispensing} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isDispensing ? "Dispensing…" : "Dispense"}</button>
      </div>

      {isLoading ? (
        <LoadingBlock text="Loading pharmacy catalog…" />
      ) : medicines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {medicines.map((m) => (
            <div
              key={m.id}
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              {/* Medicine Info */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-200/50">
                    <Pill size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {m.genericName || "Standard formulation"}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded">
                  {m.code}
                </span>
              </div>

              {/* Dosage + Stock */}
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                <Badge variant="neutral">
                  <Package size={10} />
                  {m.dosageForm || "Tablet"} — {m.strength || "Standard"}
                </Badge>
                <Badge variant="success">
                  <PackageCheck size={11} />
                  In Stock
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<AlertTriangle size={36} />}
          title="No medicines found"
          description={
            search
              ? `No results for "${search}"`
              : "Pharmacy catalog is empty. Run the seed script to populate."
          }
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Add Medicine</h3><button type="button" onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <input placeholder="Generic name" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3"><input placeholder="Strength" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Dosage form" value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <button disabled={isCreating} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isCreating ? "Saving…" : "Save Medicine"}</button>
          </form>
        </div>
      )}
    </div>
  );
};
