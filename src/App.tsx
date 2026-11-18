import { useState } from "react";
import { useAppSelector } from "./app/hooks";
import { Header } from "./components/layout/Header";
import { Sidebar, type NavTab } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { CommandPalette } from "./components/layout/CommandPalette";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientsPage } from "./pages/PatientsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { EncountersPage } from "./pages/EncountersPage";
import { AdmissionsPage } from "./pages/AdmissionsPage";
import { PharmacyPage } from "./pages/PharmacyPage";
import { LaboratoryPage } from "./pages/LaboratoryPage";
import { BillingPage } from "./pages/BillingPage";
import { AdminPage } from "./pages/AdminPage";
import { ToastContainer } from "./components/ui/ToastContainer";

export default function App() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  /* ─── Auth Gate ─── */
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <LoginPage />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentTab} />;
      case "patients":
        return <PatientsPage />;
      case "appointments":
        return <AppointmentsPage />;
      case "encounters":
        return <EncountersPage />;
      case "admissions":
        return <AdmissionsPage />;
      case "pharmacy":
        return <PharmacyPage />;
      case "laboratory":
        return <LaboratoryPage />;
      case "billing":
        return <BillingPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-900">
      <Header onSearchClick={() => setIsCommandOpen(true)} />
      <ToastContainer />
      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        onNavigate={setCurrentTab}
      />

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
