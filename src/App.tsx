import { useState, lazy, Suspense } from "react";
import { useAppSelector } from "./app/hooks";
import { Header } from "./components/layout/Header";
import { Sidebar, type NavTab } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { CommandPalette } from "./components/layout/CommandPalette";
import { LoginPage } from "./pages/LoginPage";
import { ToastContainer } from "./components/ui/ToastContainer";
import { LoadingBlock } from "./components/ui/shared";

// Code-split pages for high performance and fast sub-second bundle loads
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const PatientsPage = lazy(() =>
  import("./pages/PatientsPage").then((m) => ({ default: m.PatientsPage })),
);
const AppointmentsPage = lazy(() =>
  import("./pages/AppointmentsPage").then((m) => ({
    default: m.AppointmentsPage,
  })),
);
const EncountersPage = lazy(() =>
  import("./pages/EncountersPage").then((m) => ({ default: m.EncountersPage })),
);
const AdmissionsPage = lazy(() =>
  import("./pages/AdmissionsPage").then((m) => ({ default: m.AdmissionsPage })),
);
const PharmacyPage = lazy(() =>
  import("./pages/PharmacyPage").then((m) => ({ default: m.PharmacyPage })),
);
const LaboratoryPage = lazy(() =>
  import("./pages/LaboratoryPage").then((m) => ({ default: m.LaboratoryPage })),
);
const BillingPage = lazy(() =>
  import("./pages/BillingPage").then((m) => ({ default: m.BillingPage })),
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);

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
        return <PatientsPage onNavigate={setCurrentTab} />;
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
          <Suspense fallback={<LoadingBlock text="Loading clinical workspace…" />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
