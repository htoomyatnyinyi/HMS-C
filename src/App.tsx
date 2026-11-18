import { useState } from "react";
import { useAppSelector } from "./app/hooks";
import { Header } from "./components/layout/Header";
import { Sidebar, type NavTab } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientsPage } from "./pages/PatientsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { PharmacyPage } from "./pages/PharmacyPage";

export default function App() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");

  /* ─── Auth Gate ─── */
  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
          <div className="flex flex-col items-center justify-center gap-2 p-16 bg-white rounded-xl border border-slate-200 border-dashed">
            <span className="text-2xl">🚧</span>
            <h3 className="text-sm font-bold text-slate-700">
              {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Module
            </h3>
            <p className="text-xs text-slate-400">
              Connected to Backend Monolith — Module page coming soon
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-900">
      <Header />

      <div className="flex flex-1 w-full">
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
