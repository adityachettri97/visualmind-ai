import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import ThreeCanvas from "../components/ThreeCanvas/ThreeCanvas";
import InsightsPanel from "../components/InsightsPanel/InsightsPanel";
import VisualizationModes from "../components/VisualizationModes/VisualizationModes";
import InfoPanel from "../components/InfoPanel/InfoPanel";
import UploadDataset from "../components/UploadDataset";
import ThreeDWorkspace from "./ThreeDWorkspace";
import Visualizations from "./Visualizations";
import AIAssistant from "./AIAssistant";
import Reports from "./Reports";
import Settings from "./Settings";
import { usePageStore } from "../store/pageStore";

function Dashboard() {
  const { activePage } = usePageStore();

  return (
    <div className="h-screen bg-[#050816] text-white flex flex-col overflow-hidden print:h-auto print:overflow-visible print:block print:bg-white">
      <Navbar />

      <div className="flex flex-1 min-h-0 overflow-visible relative print:block print:h-auto">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-y-auto glass-scrollbar p-3 sm:p-4 lg:p-6 flex flex-col gap-4 lg:gap-5 print:h-auto print:overflow-visible print:block print:p-0">
          {activePage === "dashboard" && (
            <>
              <div className="flex flex-1 flex-col lg:flex-row gap-4 lg:gap-5">
                <ThreeCanvas />

                <InfoPanel />

                <InsightsPanel />
              </div>

              <VisualizationModes />
            </>
          )}

          {activePage === "workspace" && <ThreeDWorkspace />}

          {activePage === "upload" && (
            <div className="flex-1 overflow-auto glass-scrollbar">
              <UploadDataset />
            </div>
          )}

          {activePage === "visualizations" && <Visualizations />}

          {activePage === "assistant" && <AIAssistant />}

          {activePage === "reports" && <Reports />}

          {activePage === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
