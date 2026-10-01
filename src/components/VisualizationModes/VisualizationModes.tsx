import { useRef } from "react";
import { motion } from "framer-motion";
import { useVisualizationStore } from "../../store/visualizationStore";
import type { VisualizationMode } from "../../types/graph";
import { useArrowKeyNav } from "../../hooks/useArrowKeyNav";
import { useScrollFade } from "../../hooks/useScrollFade";
import { useThemeStore } from "../../store/themeStore";

const modes: { label: string; value: VisualizationMode }[] = [
  { label: "Scatter", value: "scatter" },
  { label: "Bar", value: "bar" },
  { label: "Force", value: "force" },
  { label: "Cluster", value: "cluster" },
  { label: "Timeline", value: "timeline" },
  { label: "Heatmap", value: "heatmap" },
  { label: "Treemap", value: "treemap" },
];

function VisualizationModes() {
  const { mode, setMode } = useVisualizationStore();
  const theme = useThemeStore((state) => state.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showStartFade, showEndFade } = useScrollFade(containerRef);

  useArrowKeyNav(containerRef, { orientation: "horizontal" });

  return (
    <div className="relative h-16 sm:h-20 shrink-0">
      <div
        ref={containerRef}
        className="glass glass-scrollbar h-full rounded-2xl border border-slate-800 bg-[#0B1220] flex items-center gap-3 sm:gap-4 px-4 overflow-x-auto lg:justify-center lg:overflow-visible"
      >
        {modes.map((item) => (
          <motion.button
            whileHover={{
              y: -4,
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
            key={item.value}
            onClick={() => setMode(item.value)}
            aria-pressed={mode === item.value}
            className={`glass glass-hover shrink-0 whitespace-nowrap rounded-lg border px-4 sm:px-5 py-2 transition ${
              mode === item.value
                ? theme === "light"
                  ? "bg-violet-200 border-violet-400 text-slate-900"
                  : "bg-violet-700 border-violet-700 text-white"
                : theme === "light"
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  : "border-slate-700 hover:bg-violet-600"
            }`}
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      {/* Hints that this row scrolls — there's no visible scrollbar on touch devices to make
          the overflow obvious otherwise. */}
      {showStartFade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-2xl bg-linear-to-r from-[#0B1220] to-transparent lg:hidden" />
      )}
      {showEndFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-2xl bg-linear-to-l from-[#0B1220] to-transparent lg:hidden" />
      )}
    </div>
  );
}

export default VisualizationModes;
