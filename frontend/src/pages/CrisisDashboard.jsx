import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity as ActivityIcon, LayoutGrid, Users } from "lucide-react";

import CrisisManagementList from "@/components/dashboard/CrisisManagementList";
import KanbanView from "@/components/kanban/KanbanView";

/**
 * The Crisis Management Dashboard. Owns the data context for clinicians.
 * Kanban is just a tab here — a different way to view the same crisis data.
 * The Pop-out button on the Kanban tab launches /kanban in a new window so
 * the clinician can drag it onto a second monitor.
 */
export default function CrisisDashboard() {
  const [tab, setTab] = useState("kanban");

  const popoutKanban = () => {
    const url = `${window.location.origin}/kanban`;
    // Reasonable default size; user can drag to second display, F11 for fullscreen.
    window.open(
      url,
      "crisis-kanban-popout",
      "width=1600,height=900,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  return (
    <div
      className="min-h-screen text-slate-100 relative"
      style={{
        background:
          "radial-gradient(1200px circle at 10% -10%, rgba(16,185,129,0.07), transparent 50%), radial-gradient(900px circle at 100% 10%, rgba(225,29,72,0.08), transparent 50%), #090E17",
      }}
      data-testid="crisis-dashboard"
    >
      {/* Subtle grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Dashboard header */}
      <div className="relative px-6 md:px-8 lg:px-10 pt-7 pb-4 border-b border-slate-900">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-400 font-semibold">
          <ActivityIcon className="h-3 w-3 text-emerald-400" />
          Acute Connect · Crisis Management
        </div>
        <h1 className="mt-2 font-[Manrope] text-[28px] md:text-[32px] font-extrabold tracking-tight leading-tight text-slate-50">
          Crisis Dashboard
        </h1>
      </div>

      {/* Tabs */}
      <div className="relative px-6 md:px-8 lg:px-10 pt-5">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList
            data-testid="crisis-tabs"
            className="bg-slate-900/60 border border-slate-800 p-1 rounded-lg"
          >
            <TabsTrigger
              value="patients"
              data-testid="tab-patients"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400 px-4 py-1.5 text-xs uppercase tracking-[0.16em] font-bold"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" /> Patient Profiles
            </TabsTrigger>
            <TabsTrigger
              value="kanban"
              data-testid="tab-kanban"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400 px-4 py-1.5 text-xs uppercase tracking-[0.16em] font-bold"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Kanban
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-5 pb-12">
            <CrisisManagementList />
          </TabsContent>

          <TabsContent value="kanban" className="mt-5 pb-12">
            <KanbanView variant="embed" onPopout={popoutKanban} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
