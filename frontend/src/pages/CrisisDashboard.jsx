import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Activity as ActivityIcon,
  LayoutGrid,
  Users,
  Menu,
  ChevronUp,
} from "lucide-react";

import CrisisManagementList from "@/components/dashboard/CrisisManagementList";
import KanbanView from "@/components/kanban/KanbanView";

export default function CrisisDashboard() {
  const [tab, setTab] = useState("kanban");
  const [headerOpen, setHeaderOpen] = useState(true);

  const popoutKanban = () => {
    const url = `${window.location.origin}/kanban`;
    window.open(
      url,
      "crisis-kanban-popout",
      "width=1600,height=900,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  return (
    <div
      className="min-h-screen bg-white text-slate-900 relative"
      data-testid="crisis-dashboard"
    >
      {/* Floating restore button — visible only when header is collapsed */}
      <div
        className={`fixed top-3 left-3 z-40 transition-all duration-300 ${
          headerOpen
            ? "opacity-0 -translate-x-4 pointer-events-none"
            : "opacity-100 translate-x-0"
        }`}
      >
        <button
          data-testid="restore-header-btn"
          onClick={() => setHeaderOpen(true)}
          title="Restore dashboard header"
          aria-label="Restore dashboard header"
          className="inline-flex items-center gap-2 h-10 px-3 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 text-slate-700 hover:text-slate-900 transition"
        >
          <Menu className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:inline">
            Menu
          </span>
        </button>
      </div>

      {/* Collapsible top region (header + tabs)
          - Uses grid-rows trick for a smooth height animation.
          - When collapsed, the kanban gets full-screen real estate. */}
      <div
        data-testid="dashboard-chrome"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          headerOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!headerOpen}
      >
        <div className="overflow-hidden">
          {/* Dashboard header */}
          <div className="relative px-6 md:px-8 lg:px-10 pt-7 pb-4 border-b border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">
                  <ActivityIcon className="h-3 w-3 text-emerald-600" />
                  Acute Connect · Crisis Management
                </div>
                <h1 className="mt-2 font-[Manrope] text-[28px] md:text-[32px] font-extrabold tracking-tight leading-tight text-slate-900">
                  Crisis Dashboard
                </h1>
              </div>
              <button
                data-testid="collapse-header-btn"
                onClick={() => setHeaderOpen(false)}
                title="Collapse header for full-screen Kanban"
                aria-label="Collapse header for full-screen Kanban"
                className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm text-slate-500 hover:text-slate-900 transition"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:inline">
                  Collapse
                </span>
              </button>
            </div>
          </div>

          {/* Tabs list */}
          <div className="relative px-6 md:px-8 lg:px-10 pt-5">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList
                data-testid="crisis-tabs"
                className="bg-slate-100 border border-slate-200 p-1 rounded-lg"
              >
                <TabsTrigger
                  value="patients"
                  data-testid="tab-patients"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 px-4 py-1.5 text-xs uppercase tracking-[0.16em] font-bold"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" /> Patient Profiles
                </TabsTrigger>
                <TabsTrigger
                  value="kanban"
                  data-testid="tab-kanban"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 px-4 py-1.5 text-xs uppercase tracking-[0.16em] font-bold"
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Tab content always rendered (separate from collapsible chrome) so the
          board keeps its state when toggling, and gets full-screen height when
          the header is collapsed. */}
      <div
        className={`relative px-6 md:px-8 lg:px-10 pb-12 transition-[padding] duration-300 ${
          headerOpen ? "pt-5" : "pt-14"
        }`}
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsContent value="patients">
            <CrisisManagementList />
          </TabsContent>
          <TabsContent value="kanban">
            <KanbanView variant="embed" onPopout={popoutKanban} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
