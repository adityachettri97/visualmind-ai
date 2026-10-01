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
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-[#050816] text-white print:h-auto print:overflow-visible print:block print:bg-white">
      <Navbar />

      <div className="flex min-h-0 flex-1 overflow-hidden pt-16 print:block print:h-auto print:pt-0">
        <Sidebar />

        <main className="relative flex min-h-0 flex-1 min-w-0 flex-col gap-3 overflow-y-auto p-3 glass-scrollbar sm:p-4 lg:gap-4 lg:p-5 print:h-auto print:overflow-visible print:block print:p-0">
          {activePage === "dashboard" && (
            <>
              <div className="contents lg:flex lg:flex-1 lg:flex-row lg:items-stretch lg:gap-4">
                <div className="order-1 lg:order-none lg:min-w-0 lg:flex-[1.7_1_0%]">
                  <ThreeCanvas />
                </div>

                <InfoPanel />

                <div className="order-3 lg:order-none">
                  <InsightsPanel />
                </div>
              </div>

              <div className="order-2 lg:order-none">
                <VisualizationModes />
              </div>
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
