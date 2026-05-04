import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/crm/AppShell";
import OverviewPage from "@/pages/OverviewPage";
import PatientsPage from "@/pages/PatientsPage";
import CalendarPage from "@/pages/CalendarPage";
import CallQueuePage from "@/pages/CallQueuePage";
import AIStudioPage from "@/pages/AIStudioPage";
import SysAdminPage from "@/pages/SettingsPage";
import ChatPage from "@/pages/ChatPage";
import IntegrationsPage from "@/pages/IntegrationsPage";

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
            <Route path="/board" element={<Navigate to="/patients?view=kanban" replace />} />
            <Route path="/kanban" element={<Navigate to="/patients?view=kanban" replace />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/call-queue" element={<CallQueuePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/ai-studio" element={<AIStudioPage />} />
            <Route path="/locations" element={<Navigate to="/sysadmin" replace />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/sysadmin" element={<SysAdminPage />} />
            <Route path="/settings" element={<SysAdminPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </div>
  );
}

export default App;
