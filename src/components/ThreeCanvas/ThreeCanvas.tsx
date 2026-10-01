import { motion } from "framer-motion";
import { fadeIn } from "../../animations";
import Scene from "../../three/Scene";
import Heatmap from "../Charts/Heatmap";
import Treemap from "../Charts/Treemap";
import FilterBar from "./FilterBar";
import { useVisualizationStore } from "../../store/visualizationStore";

function ThreeCanvas() {
  const { mode } = useVisualizationStore();
  const isNodeScene = mode !== "heatmap" && mode !== "treemap";

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="visualization-canvas glass glass-hover relative flex-1 min-h-[320px] h-[50vh] overflow-hidden lg:h-[calc(100vh-230px)] lg:min-h-[420px]"
    >
      {/* Purple Glow */}
      <div className="absolute top-10 left-10 h-80 w-80 rounded-full bg-violet-600/20 blur-[120px]" />

      {/* Cyan Glow */}
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_1px,transparent_1px)] bg-[length:28px_28px] opacity-20 pointer-events-none" />

      {isNodeScene && <FilterBar />}

      {/* Active visualization */}
      <div className="relative z-10 h-full w-full">
        {mode === "bar" ? <Scene barMode={true} /> : mode === "heatmap" ? <Heatmap /> : mode === "treemap" ? <Treemap /> : <Scene />}
      </div>
    </motion.div>
  );
}

export default ThreeCanvas;
