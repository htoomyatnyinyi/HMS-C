import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar, type NavTab } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientsPage } from "./pages/PatientsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { PharmacyPage } from "./pages/PharmacyPage";

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardPage />;
      case "patients":
        return <PatientsPage />;
      case "appointments":
        return <AppointmentsPage />;
      case "pharmacy":
        return <PharmacyPage />;
      default:
        return (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            {currentTab.toUpperCase()} Module - Connected to Backend Monolith API
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-900">
      {/* Top Clinic Header */}
      <Header />

      <div className="flex flex-1 w-full">
        {/* Desktop Left Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Main Clinical Content Area */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
