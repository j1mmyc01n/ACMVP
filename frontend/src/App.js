import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/crm/AppShell";
import OverviewPage from "@/pages/OverviewPage";
import PatientsPage from "@/pages/PatientsPage";
import KanbanPage from "@/pages/KanbanPage";
import CalendarPage from "@/pages/CalendarPage";
import CallQueuePage from "@/pages/CallQueuePage";
import AIStudioPage from "@/pages/AIStudioPage";
import LocationsPage from "@/pages/LocationsPage";
import SettingsPage from "@/pages/SettingsPage";

function App() {
  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "font-sans !text-[12.5px] !bg-white !text-ink !border !border-paper-rule !rounded-[12px]",
        }}
      />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/call-queue" element={<CallQueuePage />} />
            <Route path="/ai-studio" element={<AIStudioPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </div>
  );
}

export default App;
