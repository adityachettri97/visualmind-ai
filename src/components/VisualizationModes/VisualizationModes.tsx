import { useRef } from "react";
import { motion } from "framer-motion";
import { useVisualizationStore } from "../../store/visualizationStore";
import type { TwoDVisualizationMode, VisualizationDimension } from "../../store/visualizationStore";
import type { VisualizationMode } from "../../types/graph";
import { useArrowKeyNav } from "../../hooks/useArrowKeyNav";
import { useThemeStore } from "../../store/themeStore";

const modes: { label: string; value: VisualizationMode }[] = [
  { label: "Scatter", value: "scatter" },
  { label: "Bar", value: "bar" },
  { label: "Force", value: "force" },
  { label: "Cluster", value: "cluster" },
  { label: "Timeline", value: "timeline" },
];

const twoDModes: { label: string; value: TwoDVisualizationMode }[] = [
  { label: "Bar chart", value: "bar" },
  { label: "Line chart", value: "line" },
  { label: "Donut chart", value: "donut" },
  { label: "Scatter plot", value: "scatter" },
  { label: "Horizontal bars", value: "horizontalBar" },
  { label: "Heatmap", value: "heatmap" },
  { label: "Treemap", value: "treemap" },
];

function VisualizationModes() {
  const { mode, setMode, dimension, setDimension, twoDMode, setTwoDMode } = useVisualizationStore();
  const theme = useThemeStore((state) => state.theme);
  const containerRef = useRef<HTMLDivElement>(null);

  useArrowKeyNav(containerRef, { orientation: "horizontal" });

  function dimensionButtonClass(value: VisualizationDimension) {
    return `shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 font-semibold transition ${
      dimension === value
        ? theme === "light"
          ? "border-violet-400 bg-violet-200 text-slate-900"
          : "border-violet-700 bg-violet-700 text-white"
        : theme === "light"
          ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-500"
    }`;
  }

  function modeButtonClass(selected: boolean) {
    return `glass glass-hover shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 transition ${
      selected
        ? theme === "light"
          ? "border-violet-400 bg-violet-100 text-slate-900"
          : "border-violet-500 bg-violet-950/60 text-white"
        : theme === "light"
          ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          : "border-slate-700 text-slate-300 hover:bg-violet-600"
    }`;
  }

  return (
    <div className="relative shrink-0" data-tour="chart-controls">
      <div
        ref={containerRef}
        className="glass glass-scrollbar flex min-h-20 flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#0B1220] px-4 py-3"
      >
        <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Graph dimension">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Graph view</span>
          {(["2d", "3d"] as const).map((value) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setDimension(value)}
              aria-pressed={dimension === value}
              className={dimensionButtonClass(value)}
            >
              {value.toUpperCase()}
            </motion.button>
          ))}
        </div>

        <span className="hidden h-8 border-l border-slate-700 sm:block" aria-hidden="true" />
        {dimension === "3d" ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="3D graph style">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">3D style</span>
            {modes.map((item) => (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                key={item.value}
                onClick={() => setMode(item.value)}
                aria-pressed={mode === item.value}
                className={modeButtonClass(mode === item.value)}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="2D chart type">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">2D chart</span>
            {twoDModes.map((item) => (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                key={item.value}
                onClick={() => setTwoDMode(item.value)}
                aria-pressed={twoDMode === item.value}
                className={modeButtonClass(twoDMode === item.value)}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        )}
        <p className="w-full text-xs text-slate-500">
          {dimension === "2d"
            ? "Use a 2D chart for a clearer, easier-to-read view of your data."
            : "Explore your data as an interactive 3D graph."}
        </p>
      </div>
    </div>
  );
}

export default VisualizationModes;
