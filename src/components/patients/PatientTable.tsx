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
import { Phone, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Patient } from "../../features/patients/patientsApi";

interface PatientTableProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({ patients, onSelectPatient }) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "mrn",
      header: "MRN",
      cell: (info) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
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
          className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600"
        >
          Patient Name
          <ArrowUpDown size={14} />
        </button>
      ),
      cell: (info) => <span className="font-medium text-slate-900">{info.getValue() as string}</span>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: (info) => (
        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: (info) => <span className="text-slate-600">{info.getValue() as string || "—"}</span>,
    },
    {
      accessorKey: "bloodGroup",
      header: "Blood Group",
      cell: (info) => (
        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
          {info.getValue() as string || "N/A"}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: patients,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search patient by name or MRN..."
          className="w-full max-w-sm px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500">
          Showing {table.getRowModel().rows.length} of {patients.length} patients
        </div>
      </div>

      {/* 🖥️ Desktop / Tablet View: Full Data Grid Table */}
      <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectPatient?.(row.original)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile Phone View: Touch-Friendly Responsive Card List */}
      <div className="block md:hidden space-y-3">
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => {
            const p = row.original;
            return (
              <div
                key={row.id}
                onClick={() => onSelectPatient?.(p)}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm active:bg-blue-50 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {p.firstName[0]}
                      {p.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {p.firstName} {p.lastName}
                      </h4>
                      <span className="text-xs font-mono text-blue-600">{p.mrn}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                    {p.gender}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {p.phone || "No phone"}
                  </span>
                  <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                    {p.bloodGroup || "Blood N/A"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            No patients found
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center px-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-xs text-slate-500">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
