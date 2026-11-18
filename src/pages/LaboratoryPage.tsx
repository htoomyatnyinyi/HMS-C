import React, { useState } from "react";
import {
  FlaskConical,
  Plus,
  Clock,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  TestTube,
  Check,
} from "lucide-react";
import {
  useGetLabOrdersQuery,
  useGetLabOrderQuery,
  useGetLabTestsQuery,
  useCreateLabOrderMutation,
  useCollectSpecimenMutation,
  useSubmitLabResultMutation,
  type LabOrder,
} from "../features/laboratory/laboratoryApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  Badge,
  Spinner,
} from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";

export const LaboratoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: ordersData, isLoading, refetch } = useGetLabOrdersQuery({});
  const { data: testsData } = useGetLabTestsQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const { data: selectedOrderData } = useGetLabOrderQuery(
    selectedOrderId || "",
    { skip: !selectedOrderId },
  );

  const [createOrder, { isLoading: isCreating }] = useCreateLabOrderMutation();
  const [collectSpecimen, { isLoading: isCollecting }] =
    useCollectSpecimenMutation();
  const [submitLabResult, { isLoading: isSubmitting }] =
    useSubmitLabResultMutation();

  const [form, setForm] = useState({
    patientId: "",
    testId: "",
    priority: "ROUTINE",
    clinicalNotes: "Routine diagnostic workup",
  });

  const [resultForm, setResultForm] = useState({
    specimenType: "Venous Whole Blood",
    valueText: "",
    unit: "mg/dL",
    referenceRange: "70 - 100 mg/dL",
    abnormalFlag: "NORMAL",
    remarks: "Within standard normal biological limits",
  });

  const orders: LabOrder[] = ordersData?.data || [];
  const tests = testsData?.data || [];
  const patients = patientsData?.data?.data || [];

  // Metrics
  const totalOrders = orders.length;
  const statOrders = orders.filter((o) => o.priority === "STAT").length;
  const pendingOrders = orders.filter((o) => o.status !== "COMPLETED").length;
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;

  const filteredOrders =
    priorityFilter === "ALL"
      ? orders
      : orders.filter((o) => o.priority === priorityFilter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      dispatch(
        addToast({
          type: "error",
          title: "Patient Required",
          message: "Please select a patient for the laboratory order",
        }),
      );
      return;
    }

    const test = tests.find((candidate) => candidate.id === form.testId);
    if (!test) {
      dispatch(
        addToast({
          type: "error",
          title: "Select Test",
          message: "Please select a diagnostic test from the formulary",
        }),
      );
      return;
    }

    try {
      await createOrder({
        patientId: form.patientId,
        priority: form.priority,
        laboratoryId: test.laboratoryId,
        testIds: [test.id],
        notes: form.clinicalNotes,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Lab Requisition Dispatched",
          message: `Order dispatched with ${form.priority} priority`,
        }),
      );
      setIsModalOpen(false);
      setForm({
        patientId: "",
        testId: "",
        priority: "ROUTINE",
        clinicalNotes: "Routine diagnostic workup",
      });
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Failed to create lab requisition";
      dispatch(
        addToast({
          type: "error",
          title: "Order Failed",
          message: errorMsg || "Failed to create lab requisition",
        }),
      );
    }
  };

  const selectedItem = selectedOrderData?.data?.items?.[0];

  const handleCollect = async () => {
    if (!selectedItem) return;
    try {
      await collectSpecimen({
        orderItemId: selectedItem.id,
        specimenType: resultForm.specimenType,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Specimen Accessioned",
          message: `${resultForm.specimenType} registered in lab queue`,
        }),
      );
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Specimen collection failed";
      dispatch(
        addToast({
          type: "error",
          title: "Collection Failed",
          message: errorMsg || "Specimen collection failed",
        }),
      );
    }
  };

  const handleSubmitResult = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItem || !resultForm.valueText.trim()) return;

    try {
      await submitLabResult({
        orderItemId: selectedItem.id,
        valueText: resultForm.valueText,
        unit: resultForm.unit || undefined,
        referenceRange: resultForm.referenceRange || undefined,
        abnormalFlag:
          resultForm.abnormalFlag !== "NORMAL"
            ? resultForm.abnormalFlag
            : undefined,
        remarks: resultForm.remarks || undefined,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Lab Results Certified",
          message: "Diagnostic report submitted and verified",
        }),
      );
      setSelectedOrderId(null);
      setResultForm({
        specimenType: "Venous Whole Blood",
        valueText: "",
        unit: "mg/dL",
        referenceRange: "70 - 100 mg/dL",
        abnormalFlag: "NORMAL",
        remarks: "Within standard normal biological limits",
      });
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Failed to submit result";
      dispatch(
        addToast({
          type: "error",
          title: "Submission Failed",
          message: errorMsg || "Failed to submit diagnostic result",
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Diagnostic Laboratory & Pathology"
        description="Specimen accessioning, clinical biochemistry, hematology, and verified reporting"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
          >
            <Plus size={15} />
            <span>Order Lab Test</span>
          </button>
        }
      />

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FlaskConical size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {totalOrders}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Total Requisitions
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {statOrders}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              STAT (Critical)
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {pendingOrders}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Pending Analysis
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-tight">
              {completedOrders}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Verified Reports
            </div>
          </div>
        </div>
      </div>

      {/* Common Panels Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Standard Laboratory Diagnostic Panels
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            "Complete Blood Count (CBC)",
            "Comprehensive Metabolic Panel (CMP)",
            "Liver Function Tests (LFT)",
            "Lipid Profile (HDL/LDL/Trig)",
            "HbA1c & Fasting Glucose",
            "Renal Function (BUN/Creatinine)",
            "Urinalysis & Microscopy",
            "Dengue NS1 Antigen & IgM",
          ].map((panel) => (
            <span
              key={panel}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-default transition-colors"
            >
              {panel}
            </span>
          ))}
        </div>
      </div>

      {/* Priority Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            Priority Filter:
          </span>
          {[
            { id: "ALL", label: "All Requisitions" },
            { id: "STAT", label: "STAT (Immediate)" },
            { id: "URGENT", label: "Urgent" },
            { id: "ROUTINE", label: "Routine" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPriorityFilter(item.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                priorityFilter === item.id
                  ? item.id === "STAT"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing {filteredOrders.length} orders
        </span>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <LoadingBlock text="Loading pathology queue & requisitions…" />
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrders.map((ord) => {
            const isStat = ord.priority === "STAT";
            const isUrgent = ord.priority === "URGENT";
            const isCompleted = ord.status === "COMPLETED";

            return (
              <div
                key={ord.id}
                className={cn(
                  "p-4 bg-white rounded-xl border shadow-xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between",
                  isStat
                    ? "border-rose-200 bg-rose-50/10"
                    : "border-slate-200",
                )}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {ord.orderNo}
                    </span>
                    <Badge
                      variant={
                        isStat ? "danger" : isUrgent ? "warning" : "info"
                      }
                    >
                      {ord.priority}
                    </Badge>
                  </div>

                  {/* Clinical Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {ord.clinicalNotes || "Diagnostic Workup"}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                      <Clock size={11} />
                      {formatDateTime(ord.createdAt)}
                    </p>
                  </div>

                  {/* Specimen Status Pipeline */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pipeline:</span>
                      <span className="font-bold text-slate-800">
                        {ord.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isCompleted
                            ? "w-full bg-emerald-500"
                            : ord.status === "COLLECTED"
                              ? "w-2/3 bg-blue-500"
                              : "w-1/3 bg-amber-500",
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Patient:{" "}
                    <strong className="text-slate-700">
                      {ord.patientId.slice(0, 8)}
                    </strong>
                  </span>
                  <button
                    onClick={() => setSelectedOrderId(ord.id)}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Lab Dossier</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FlaskConical size={36} />}
          title="No Lab Orders in Queue"
          description="There are currently no diagnostic test requisitions pending."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Create Requisition
            </button>
          }
        />
      )}

      {/* ─── CREATE LAB ORDER MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  New Laboratory Requisition
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order pathology or clinical biochemistry diagnostics
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

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={form.patientId}
                  onChange={(e) =>
                    setForm({ ...form, patientId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Laboratory Test Panel *
                </label>
                <select
                  required
                  value={form.testId}
                  onChange={(e) =>
                    setForm({ ...form, testId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose diagnostic test --</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.name} ({test.code}) — {test.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Priority *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ROUTINE", label: "Routine" },
                    { id: "URGENT", label: "Urgent" },
                    { id: "STAT", label: "STAT (Immediate)" },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setForm({ ...form, priority: p.id })}
                      className={cn(
                        "py-2 text-xs font-semibold rounded-lg border transition-all",
                        form.priority === p.id
                          ? p.id === "STAT"
                            ? "bg-rose-50 text-rose-700 border-rose-300 shadow-xs"
                            : "bg-blue-50 text-blue-700 border-blue-300 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Indication / Physician Notes *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rule out anemia, fever of unknown origin..."
                  value={form.clinicalNotes}
                  onChange={(e) =>
                    setForm({ ...form, clinicalNotes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <Spinner size={14} className="text-white" />
                      <span>Dispatching…</span>
                    </>
                  ) : (
                    <span>Submit Requisition</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LAB ORDER & RESULT DOSSIER MODAL ─── */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Beaker size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Diagnostic Report & Results
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order Ref:{" "}
                    {selectedOrderData?.data?.orderNo || selectedOrderId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {!selectedItem ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No diagnostic items found on this requisition order.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Specimen Status Capsule */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-500">
                    Accession Status:{" "}
                    <strong className="text-slate-800">
                      {selectedItem.status}
                    </strong>
                  </span>
                  {selectedItem.specimen ? (
                    <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Barcode: {selectedItem.specimen.accessionNo}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Specimen Pending
                    </span>
                  )}
                </div>

                {/* Final Result Card if already resulted */}
                {selectedItem.result && (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        Certified Final Result
                      </span>
                      {selectedItem.result.abnormalFlag &&
                        selectedItem.result.abnormalFlag !== "NORMAL" && (
                          <Badge variant="danger">
                            {selectedItem.result.abnormalFlag}
                          </Badge>
                        )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-emerald-950">
                        {selectedItem.result.valueText ||
                          selectedItem.result.valueNumber}
                      </span>
                      {selectedItem.result.unit && (
                        <span className="text-xs text-emerald-700 font-semibold">
                          {selectedItem.result.unit}
                        </span>
                      )}
                    </div>

                    {selectedItem.result.referenceRange && (
                      <p className="text-xs text-emerald-700">
                        Reference Range:{" "}
                        <strong>{selectedItem.result.referenceRange}</strong>
                      </p>
                    )}

                    {selectedItem.result.remarks && (
                      <p className="text-xs text-emerald-800 italic pt-1 border-t border-emerald-200/50">
                        Remarks: {selectedItem.result.remarks}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 1: Specimen Collection if not collected yet */}
                {!selectedItem.specimen && (
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                    <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <TestTube size={14} className="text-blue-600" />
                      Step 1: Collect & Accession Specimen
                    </h4>
                    <div className="flex gap-2">
                      <input
                        value={resultForm.specimenType}
                        onChange={(e) =>
                          setResultForm({
                            ...resultForm,
                            specimenType: e.target.value,
                          })
                        }
                        placeholder="Specimen Type (e.g. Venous Blood)"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        type="button"
                        onClick={handleCollect}
                        disabled={isCollecting}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      >
                        {isCollecting ? "Accessioning…" : "Collect Specimen"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Diagnostic Result Entry */}
                <form
                  onSubmit={handleSubmitResult}
                  className="space-y-3 border-t border-slate-100 pt-3"
                >
                  <h4 className="text-xs font-bold text-slate-800">
                    Step 2: Enter Quantitative / Qualitative Findings
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Result Finding / Value *
                    </label>
                    <input
                      required
                      placeholder="e.g. 92, Positive, 13.5"
                      value={resultForm.valueText}
                      onChange={(e) =>
                        setResultForm({
                          ...resultForm,
                          valueText: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Unit
                      </label>
                      <input
                        placeholder="e.g. mg/dL, g/L, %"
                        value={resultForm.unit}
                        onChange={(e) =>
                          setResultForm({ ...resultForm, unit: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Reference Range
                      </label>
                      <input
                        placeholder="e.g. 70 - 100 mg/dL"
                        value={resultForm.referenceRange}
                        onChange={(e) =>
                          setResultForm({
                            ...resultForm,
                            referenceRange: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Abnormal Flag
                      </label>
                      <select
                        value={resultForm.abnormalFlag}
                        onChange={(e) =>
                          setResultForm({
                            ...resultForm,
                            abnormalFlag: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High (Above Range)</option>
                        <option value="LOW">Low (Below Range)</option>
                        <option value="CRITICAL_HIGH">
                          Critical High (Panic)
                        </option>
                        <option value="CRITICAL_LOW">
                          Critical Low (Panic)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Remarks
                      </label>
                      <input
                        placeholder="Pathology impressions"
                        value={resultForm.remarks}
                        onChange={(e) =>
                          setResultForm({
                            ...resultForm,
                            remarks: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size={14} className="text-white" />
                        <span>Submitting…</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Certify & Submit Lab Result</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
