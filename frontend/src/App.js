import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import KanbanBoard from "@/pages/KanbanBoard";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KanbanBoard />} />
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
