import { useDatasetStore } from "../store/datasetStore";
import { useSidebarStore } from "../store/sidebarStore";

function Settings() {
  const { fileName, analysis, history, clearDataset, clearHistory } = useDatasetStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  return (
    <div className="flex-1 overflow-y-auto glass-scrollbar flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h2 className="text-xl font-semibold">Settings</h2>

        <p className="text-sm text-slate-400">Manage your dataset and app preferences.</p>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-1">Dataset</h3>

        <p className="text-sm text-slate-400 mb-4">
          {fileName ? `${fileName} • ${analysis?.rowCount.toLocaleString()} rows` : "No dataset uploaded."}
        </p>

        <button
          onClick={clearDataset}
          disabled={!fileName}
          className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear Dataset
        </button>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-1">Dataset History</h3>

        <p className="text-sm text-slate-400 mb-4">
          {history.length > 0 ? `${history.length} previous dataset${history.length === 1 ? "" : "s"} saved.` : "No previous datasets saved."}
        </p>

        <button
          onClick={clearHistory}
          disabled={history.length === 0}
          className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear History
        </button>
      </div>

      <div className="hidden lg:block glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Collapse sidebar by default</p>

            <p className="text-xs text-slate-500">Show the icon-only sidebar on desktop.</p>
          </div>

          <button
            onClick={toggleSidebar}
            aria-pressed={isCollapsed}
            className={`shrink-0 w-12 h-7 rounded-full transition relative ${isCollapsed ? "bg-violet-600" : "bg-slate-700"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${isCollapsed ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-3">About</h3>

        <div className="text-sm text-slate-400 space-y-1">
          <p>VisualMind AI</p>

          <p>AI analysis powered by Groq.</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
