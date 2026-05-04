import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import CrisisDashboard from "@/pages/CrisisDashboard";
import KanbanPopout from "@/pages/KanbanPopout";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CrisisDashboard />} />
          <Route path="/kanban" element={<KanbanPopout />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="light"
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#0f172a",
          },
        }}
      />
    </div>
  );
}

export default App;
