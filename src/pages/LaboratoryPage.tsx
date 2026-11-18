import React, { useState } from "react";
import { FlaskConical, Plus, Clock, FileSpreadsheet, X } from "lucide-react";
import {
  useGetLabOrdersQuery,
  useGetLabOrderQuery,
  useGetLabTestsQuery,
  useCreateLabOrderMutation,
  useCollectSpecimenMutation,
  useSubmitLabResultMutation,
} from "../features/laboratory/laboratoryApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import { PageHeader, LoadingBlock, EmptyState, Badge } from "../components/ui/shared";
import { formatDateTime } from "../lib/utils";

export const LaboratoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: ordersData, isLoading } = useGetLabOrdersQuery({});
  const { data: testsData } = useGetLabTestsQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const [createOrder, { isLoading: isCreating }] = useCreateLabOrderMutation();
  const [collectSpecimen, { isLoading: isCollecting }] = useCollectSpecimenMutation();
  const [submitLabResult, { isLoading: isSubmitting }] = useSubmitLabResultMutation();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: selectedOrderData } = useGetLabOrderQuery(selectedOrderId || "", { skip: !selectedOrderId });
  const [resultForm, setResultForm] = useState({ specimenType: "Blood", valueText: "", unit: "", referenceRange: "", abnormalFlag: "", remarks: "" });

  const [form, setForm] = useState({
    patientId: "",
    testId: "",
    priority: "ROUTINE",
    clinicalNotes: "",
  });

  const orders = ordersData?.data || [];
  const tests = testsData?.data || [];
  const patients = patientsData?.data?.data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) return;
    const test = tests.find((candidate) => candidate.id === form.testId);
    if (!test) {
      dispatch(addToast({ type: "error", title: "No laboratory test", message: "Seed or create a laboratory test first" }));
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
      setIsModalOpen(false);
      setForm({ patientId: "", testId: "", priority: "ROUTINE", clinicalNotes: "" });
      dispatch(addToast({ type: "success", title: "Lab Requisition Created", message: "Specimen collection pending" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Order Failed", message: err?.data?.error || "Error occurred" }));
    }
  };

  const selectedItem = selectedOrderData?.data?.items?.[0];
  const handleCollect = async () => {
    if (!selectedItem) return;
    await collectSpecimen({ orderItemId: selectedItem.id, specimenType: resultForm.specimenType }).unwrap();
  };
  const handleSubmitResult = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItem || !resultForm.valueText.trim()) return;
    await submitLabResult({ orderItemId: selectedItem.id, valueText: resultForm.valueText, unit: resultForm.unit || undefined, referenceRange: resultForm.referenceRange || undefined, abnormalFlag: resultForm.abnormalFlag || undefined, remarks: resultForm.remarks || undefined }).unwrap();
    setSelectedOrderId(null);
    setResultForm({ specimenType: "Blood", valueText: "", unit: "", referenceRange: "", abnormalFlag: "", remarks: "" });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Diagnostic Laboratory"
        description="Pathology requisition orders, blood panels, specimen analysis, and results"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} />
            Order Lab Test
          </button>
        }
      />

      {/* Catalog quick peek */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Common Diagnostic Panels
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Complete Blood Count (CBC)", "Lipid Panel", "Liver Function Test (LFT)", "Blood Glucose (HbA1c)", "Renal Profile", "Urinalysis"].map((t) => (
            <span key={t} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-default">
              {t}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock text="Loading laboratory orders..." />
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {ord.orderNo}
                </span>
                <Badge variant={ord.priority === "STAT" ? "danger" : "info"}>
                  {ord.priority}
                </Badge>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Laboratory Test</label>
                <select
                  required
                  value={form.testId}
                  onChange={(e) => setForm({ ...form, testId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose test --</option>
                  {tests.map((test) => <option key={test.id} value={test.id}>{test.name} ({test.code})</option>)}
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">{ord.clinicalNotes || "Routine Diagnostic Specimen"}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Clock size={11} /> {formatDateTime(ord.createdAt)}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Status: <strong className="text-slate-700">{ord.status}</strong></span>
                <button onClick={() => setSelectedOrderId(ord.id)} className="text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                  <FileSpreadsheet size={13} /> View Results
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FlaskConical size={36} />}
          title="No Lab Orders"
          description="There are no active diagnostic requisitions pending in the laboratory queue."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Order Lab Test
            </button>
          }
        />
      )}

      {/* Lab Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Order Laboratory Test</h3>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Patient</label>
                <select
                  required
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="STAT">STAT (Immediate Critical)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Clinical Notes / Requisition</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC, Serum Creatinine & Electrolytes..."
                  value={form.clinicalNotes}
                  onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isCreating ? "Ordering..." : "Dispatch Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Laboratory Result</h3><button onClick={() => setSelectedOrderId(null)}><X size={18} /></button></div>
            {!selectedItem ? <p className="text-sm text-slate-500">No order item found.</p> : <>
              <p className="text-xs text-slate-500">Item status: <strong>{selectedItem.status}</strong></p>
              {selectedItem.specimen && <p className="text-xs text-slate-500">Accession: <strong>{selectedItem.specimen.accessionNo}</strong></p>}
              {selectedItem.result && <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-900"><strong>Final result:</strong> {selectedItem.result.valueText || selectedItem.result.valueNumber} {selectedItem.result.unit || ""}{selectedItem.result.referenceRange ? ` (reference: ${selectedItem.result.referenceRange})` : ""}{selectedItem.result.remarks ? ` — ${selectedItem.result.remarks}` : ""}</div>}
              <div className="flex gap-2"><input value={resultForm.specimenType} onChange={(e) => setResultForm({ ...resultForm, specimenType: e.target.value })} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs" /><button onClick={handleCollect} disabled={isCollecting} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white">{isCollecting ? "Collecting…" : "Collect Specimen"}</button></div>
              <form onSubmit={handleSubmitResult} className="space-y-2 border-t border-slate-100 pt-3"><input required placeholder="Result value" value={resultForm.valueText} onChange={(e) => setResultForm({ ...resultForm, valueText: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /><div className="grid grid-cols-2 gap-2"><input placeholder="Unit" value={resultForm.unit} onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /><input placeholder="Reference range" value={resultForm.referenceRange} onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div><input placeholder="Remarks" value={resultForm.remarks} onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /><button disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white">{isSubmitting ? "Submitting…" : "Submit Final Result"}</button></form>
            </>}
          </div>
        </div>
      )}
    </div>
  );
};
