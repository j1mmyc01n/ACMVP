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
        theme="dark"
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: "#0B121C",
            border: "1px solid #1e293b",
            color: "#e2e8f0",
          },
        }}
      />
    </div>
  );
}

export default App;
