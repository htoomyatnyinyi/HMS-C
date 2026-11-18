import React, { useState } from "react";
import {
  Pill,
  Search,
  PackageCheck,
  AlertTriangle,
  Package,
  Plus,
  X,
  CheckCircle2,
  Boxes,
  ClipboardList,
  Check,
} from "lucide-react";
import {
  useGetMedicinesQuery,
  useCreateMedicineMutation,
  useCreateDispensationMutation,
  type Medicine,
} from "../features/pharmacy/pharmacyApi";
import {
  useGetPrescriptionsQuery,
  type Prescription,
} from "../features/prescriptions/prescriptionsApi";
import {
  LoadingBlock,
  EmptyState,
  PageHeader,
  Badge,
  Spinner,
} from "../components/ui/shared";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import { cn } from "../lib/utils";

export const PharmacyPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "dispensing">("catalog");
  const [dosageFilter, setDosageFilter] = useState<string>("ALL");

  const { data, isLoading, refetch } = useGetMedicinesQuery({ search });
  const [createMedicine, { isLoading: isCreating }] = useCreateMedicineMutation();
  const [createDispensation, { isLoading: isDispensing }] =
    useCreateDispensationMutation();
  const { data: prescriptionsData } = useGetPrescriptionsQuery({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    genericName: "",
    strength: "500 mg",
    dosageForm: "Tablet",
    unit: "tablet",
  });

  const medicines: Medicine[] = data?.data || [];
  const activePrescriptions: Prescription[] = (
    prescriptionsData?.data || []
  ).filter((p) => p.status === "ACTIVE" && (p.items?.length || 0) > 0);

  // Metrics
  const totalMeds = medicines.length;
  const lowStockMeds = medicines.filter(
    (m) => Number(m.stockQuantity || 0) < 50,
  ).length;
  const waitingPrescriptions = activePrescriptions.length;
  const totalStockUnits = medicines.reduce(
    (acc, m) => acc + (Number(m.stockQuantity) || 0),
    0,
  );

  // Filtered medicines
  const filteredMedicines =
    dosageFilter === "ALL"
      ? medicines
      : medicines.filter(
          (m) =>
            m.dosageForm?.toLowerCase() === dosageFilter.toLowerCase(),
        );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code || !form.name) return;
    try {
      await createMedicine(form).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Medication Added",
          message: `${form.name} (${form.strength}) added to pharmacy formulary`,
        }),
      );
      setIsModalOpen(false);
      setForm({
        code: "",
        name: "",
        genericName: "",
        strength: "500 mg",
        dosageForm: "Tablet",
        unit: "tablet",
      });
      refetch();
    } catch (error: unknown) {
      const errorMsg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Failed to add medicine";
      dispatch(
        addToast({
          type: "error",
          title: "Registration Failed",
          message: errorMsg || "Error occurred registering medicine",
        }),
      );
    }
  };

  const handleDispensePrescription = async (prescription: Prescription) => {
    const items = prescription.items || [];
    if (items.length === 0) return;

    try {
      await createDispensation({
        prescriptionId: prescription.id,
        items: items.map((item) => ({
          prescriptionItemId: item.id,
          quantity: item.quantity,
        })),
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Prescription Dispensed",
          message: `Rx ${prescription.prescriptionNo} fulfilled and inventory deducted`,
        }),
      );
      refetch();
    } catch (error: unknown) {
      const errorMsg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : "Failed to dispense prescription";
      dispatch(
        addToast({
          type: "error",
          title: "Dispense Failed",
          message: errorMsg || "Failed to dispense prescription",
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pharmacy & Formulary Dispensary"
        description="Medication catalog, inventory control, automated dispensing, and batch tracking"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
              <button
                onClick={() => setActiveTab("catalog")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors",
                  activeTab === "catalog"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Boxes size={13} />
                <span className="hidden sm:inline">Formulary</span>
              </button>
              <button
                onClick={() => setActiveTab("dispensing")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors relative",
                  activeTab === "dispensing"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <ClipboardList size={13} />
                <span className="hidden sm:inline">Dispensing Queue</span>
                {waitingPrescriptions > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                )}
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
            >
              <Plus size={15} />
              <span>Add Medicine</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Pill size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {totalMeds}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Formulary Items
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {lowStockMeds}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Low Stock Alerts
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ClipboardList size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600 leading-tight">
              {waitingPrescriptions}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Queue Prescriptions
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {totalStockUnits.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Total Units In-Stock
            </div>
          </div>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand, generic name, or code…"
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>

            {/* Dosage Form Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
                Form:
              </span>
              {[
                { id: "ALL", label: "All" },
                { id: "Tablet", label: "Tablets" },
                { id: "Capsule", label: "Capsules" },
                { id: "Syrup", label: "Syrup / Liquid" },
                { id: "Injection", label: "Injectables" },
              ].map((df) => (
                <button
                  key={df.id}
                  onClick={() => setDosageFilter(df.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                    dosageFilter === df.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Cards */}
          {isLoading ? (
            <LoadingBlock text="Loading pharmacy formulary…" />
          ) : filteredMedicines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMedicines.map((m) => {
                const stockQty = Number(m.stockQuantity || 0);
                const isCritical = stockQty < 20;
                const isModerate = stockQty >= 20 && stockQty < 100;

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
                            <Pill size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">
                              {m.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {m.genericName || "Standard generic formulary"}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {m.code}
                        </span>
                      </div>

                      {/* Dosage Form & Strength */}
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="neutral">
                          <Package size={10} />
                          {m.dosageForm || "Tablet"}
                        </Badge>
                        {m.strength && (
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {m.strength}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Status Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Unit: {m.unit || "unit"}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1",
                          isCritical
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isModerate
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        )}
                      >
                        <PackageCheck size={11} />
                        {stockQty > 0 ? `${stockQty} in stock` : "Depleted"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<AlertTriangle size={36} />}
              title="No medicines match filter"
              description="Try adjusting your brand search or dosage form filter."
            />
          )}
        </>
      ) : (
        /* ─── DISPENSING QUEUE VIEW ─── */
        <div className="space-y-4">
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Active Outpatient & Inpatient Prescriptions
              </h3>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Pharmacist dispensing queue awaiting batch verification & label
                printing
              </p>
            </div>
            <span className="font-mono text-xs font-bold bg-white text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200">
              {activePrescriptions.length} pending
            </span>
          </div>

          {activePrescriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                        {rx.prescriptionNo}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Patient ID:{" "}
                        <strong className="text-slate-700 font-mono">
                          {rx.patientId.slice(0, 8)}
                        </strong>
                      </p>
                    </div>
                    <Badge variant="warning">Awaiting Dispense</Badge>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                    {rx.items?.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {item.dose || "Formulary Medication"}
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            {item.frequency || "Daily"} •{" "}
                            {item.instructions || "After meals"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Dispense Action */}
                  <button
                    onClick={() => handleDispensePrescription(rx)}
                    disabled={isDispensing}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-sm shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isDispensing ? (
                      <>
                        <Spinner size={14} className="text-white" />
                        <span>Fulfilling…</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Dispense & Deduct Inventory</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 size={36} />}
              title="Dispensing Queue Clear"
              description="All issued prescriptions have been fulfilled by the pharmacy."
            />
          )}
        </div>
      )}

      {/* ─── ADD MEDICINE MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md space-y-3.5 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Add Formulary Medicine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Register new pharmaceutical stock item
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
                  Medicine Code *
                </label>
                <input
                  required
                  placeholder="e.g. MED-AMOX-500"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Brand Name *
                </label>
                <input
                  required
                  placeholder="e.g. Amoxil"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Generic Chemical Name
              </label>
              <input
                placeholder="e.g. Amoxicillin Trihydrate"
                value={form.genericName}
                onChange={(e) =>
                  setForm({ ...form, genericName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Strength
                </label>
                <input
                  placeholder="500 mg"
                  value={form.strength}
                  onChange={(e) =>
                    setForm({ ...form, strength: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Dosage Form
                </label>
                <select
                  value={form.dosageForm}
                  onChange={(e) =>
                    setForm({ ...form, dosageForm: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Topical">Topical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Dispense Unit
                </label>
                <input
                  placeholder="tablet"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
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
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Register Item</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
