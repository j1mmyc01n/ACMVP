import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "@/pages/Dashboard";

function App() {
  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "font-mono !text-xs !bg-white !text-ink !border !border-paper-rule !rounded-none",
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients/:id" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
