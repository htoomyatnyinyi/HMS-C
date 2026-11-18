import React, { useState } from "react";
import {
  Pill,
  Search,
  PackageCheck,
  AlertTriangle,
  Package,
} from "lucide-react";
import { useGetMedicinesQuery } from "../features/pharmacy/pharmacyApi";
import {
  LoadingBlock,
  EmptyState,
  PageHeader,
  Badge,
} from "../components/ui/shared";

export const PharmacyPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetMedicinesQuery({ search });

  const medicines = data?.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pharmacy & Formulary"
        description="Medicines catalog, dosage forms, and dispensing"
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
    </div>
  );
};
