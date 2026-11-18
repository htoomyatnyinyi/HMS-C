import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Phone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Calendar,
} from "lucide-react";
import type { Patient } from "../../features/patients/patientsApi";
import { Badge, EmptyState } from "../ui/shared";
import { cn, calculateAge, formatDate } from "../../lib/utils";

interface PatientTableProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  onSelectPatient,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "mrn",
      header: "MRN",
      cell: (info) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200/60">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
        >
          Patient Name
          <ArrowUpDown size={13} />
        </button>
      ),
      cell: (info) => {
        const p = info.row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase text-white shadow-xs",
                p.gender === "FEMALE"
                  ? "bg-linear-to-br from-pink-500 to-rose-600"
                  : "bg-linear-to-br from-blue-500 to-indigo-600",
              )}
            >
              {p.firstName[0]}
              {p.lastName[0]}
            </div>
            <div>
              <div className="font-semibold text-slate-900 leading-tight">
                {info.getValue() as string}
              </div>
              <div className="text-[11px] text-slate-400">
                Reg: {formatDate(p.createdAt)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "gender",
      header: "Gender / Age",
      cell: (info) => {
        const p = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={p.gender === "FEMALE" ? "info" : "neutral"}>
              {p.gender}
            </Badge>
            {p.dateOfBirth && (
              <span className="text-xs text-slate-600 font-medium">
                {calculateAge(p.dateOfBirth)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: (info) => {
        const val = info.getValue() as string;
        return (
          <span className="text-slate-600 text-xs flex items-center gap-1.5 font-mono">
            {val ? (
              <>
                <Phone size={11} className="text-slate-400" />
                {val}
              </>
            ) : (
              <span className="text-slate-300 font-sans">—</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "bloodGroup",
      header: "Blood Group",
      cell: (info) => {
        const bg = info.getValue() as string;
        return bg ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {bg.replace("_", "")}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectPatient?.(info.row.original);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <span>EHR Dossier</span>
          <ExternalLink size={12} />
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data: patients,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const rowCount = table.getRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Search + Count */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Quick filter table by name, MRN, phone…"
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {rowCount} of {patients.length} registered
          </span>
        </div>
      </div>

      {/* 🖥️ Desktop Table */}
      <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 font-semibold">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rowCount > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectPatient?.(row.original)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-slate-400 text-sm"
                >
                  <EmptyState
                    title="No matching patients"
                    description="No patient records match the current filter criteria."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile Cards */}
      <div className="block md:hidden space-y-2.5">
        {rowCount > 0 ? (
          table.getRowModel().rows.map((row) => {
            const p = row.original;
            return (
              <div
                key={row.id}
                onClick={() => onSelectPatient?.(p)}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs active:bg-blue-50 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs",
                        p.gender === "FEMALE"
                          ? "bg-linear-to-br from-pink-500 to-rose-600"
                          : "bg-linear-to-br from-blue-500 to-indigo-600",
                      )}
                    >
                      {p.firstName[0]}
                      {p.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {p.firstName} {p.lastName}
                      </h4>
                      <span className="text-[11px] font-mono text-blue-600">
                        {p.mrn}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={p.gender === "FEMALE" ? "info" : "neutral"}>
                      {p.gender}
                    </Badge>
                    {p.bloodGroup && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {p.bloodGroup.replace("_", "")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={12} className="text-slate-400" />{" "}
                    {p.phone || "No phone"}
                  </span>
                  {p.dateOfBirth ? (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {calculateAge(p.dateOfBirth)}
                    </span>
                  ) : (
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      View EHR <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No patients found"
            description="Try a different search term"
          />
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
            table.getCanPreviousPage()
              ? "text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-xs"
              : "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed",
          )}
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <span className="text-xs text-slate-500">
          Page{" "}
          <span className="font-semibold text-slate-800">
            {table.getState().pagination.pageIndex + 1}
          </span>{" "}
          of {table.getPageCount() || 1}
        </span>

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
            table.getCanNextPage()
              ? "text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-xs"
              : "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed",
          )}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
