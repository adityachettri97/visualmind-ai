import { motion } from "framer-motion";
import { fadeIn } from "../../animations";
import Scene from "../../three/Scene";
import Heatmap from "../Charts/Heatmap";
import Treemap from "../Charts/Treemap";
import BarChart from "../Charts/BarChart";
import AdditionalCharts from "../Charts/AdditionalCharts";
import FilterBar from "./FilterBar";
import { useVisualizationStore } from "../../store/visualizationStore";
import { useDatasetStore } from "../../store/datasetStore";
import { usePageStore } from "../../store/pageStore";
import { useThemeStore } from "../../store/themeStore";
import { Upload } from "lucide-react";

function ThreeCanvas() {
  const { mode, dimension, twoDMode } = useVisualizationStore();
  const hasDataset = useDatasetStore((state) => state.data.length > 0);
  const setActivePage = usePageStore((state) => state.setActivePage);
  const isLightTheme = useThemeStore((state) => state.theme === "light");

  return (
    <motion.div
      data-tour="dashboard-chart"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="visualization-canvas glass glass-hover relative flex-1 min-h-[320px] h-[50vh] overflow-hidden lg:h-[calc(100vh-230px)] lg:min-h-[420px]"
    >
      {hasDataset ? (
        <>
          {/* Purple Glow */}
          <div className="visualization-glow-purple absolute top-10 left-10 h-80 w-80 rounded-full bg-violet-600/20 blur-[120px]" />

          {/* Cyan Glow */}
          <div className="visualization-glow-cyan absolute bottom-10 right-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />

          {/* Grid Overlay */}
          <div className="visualization-grid absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_1px,transparent_1px)] bg-[length:28px_28px] opacity-20 pointer-events-none" />

          {dimension === "3d" && <FilterBar />}

          {/* Active visualization */}
          <div className="relative z-10 h-full w-full">
            {dimension === "2d" ? (
              twoDMode === "heatmap" ? (
                <Heatmap />
              ) : twoDMode === "treemap" ? (
                <Treemap />
              ) : twoDMode === "bar" ? (
                <BarChart />
              ) : (
                <AdditionalCharts mode={twoDMode} />
              )
            ) : mode === "bar" ? (
              <Scene barMode={true} />
            ) : (
              <Scene />
            )}
          </div>
        </>
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <button
            type="button"
            onClick={() => setActivePage("upload")}
            className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              isLightTheme
                ? "border-violet-800 bg-violet-700 text-white hover:border-violet-900 hover:bg-violet-800"
                : "border-white/20 bg-white/5 text-white/80 backdrop-blur-md hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-white"
            }`}
          >
            <Upload size={18} aria-hidden="true" />
            Add dataset
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default ThreeCanvas;
