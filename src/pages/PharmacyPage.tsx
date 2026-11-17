import React, { useState } from "react";
import { Pill, Search, PackageCheck } from "lucide-react";
import { useGetMedicinesQuery } from "../features/pharmacy/pharmacyApi";

export const PharmacyPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetMedicinesQuery({ search });

  const medicines = data?.data || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-slate-900">Pharmacy & Formulary</h2>
        <p className="text-xs text-slate-500">Medicines catalog, dosage forms, and dispensing</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine by brand or generic..."
          className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading pharmacy catalog...
        </div>
      ) : medicines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {medicines.map((m) => (
            <div key={m.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Pill size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{m.name}</h4>
                    <p className="text-xs text-slate-500">{m.genericName || "Standard"}</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-400 font-semibold">{m.code}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span className="bg-slate-50 px-2 py-0.5 rounded text-[11px] font-medium">
                  {m.dosageForm || "Tablet"} - {m.strength || "Standard"}
                </span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <PackageCheck size={13} /> In Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          No medicines match your search
        </div>
      )}
    </div>
  );
};
