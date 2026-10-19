import { useState } from "react";
import { useDatasetStore } from "../../store/datasetStore";
import { useNodeStore } from "../../store/nodeStore";
import { datasetToGraph, formatValue, summarizeByGroup } from "../../utils/datasetToGraph";
import { useThemeStore } from "../../store/themeStore";

function BarChart() {
  const { data, analysis } = useDatasetStore();
  const { selectedNode, setSelectedNode } = useNodeStore();
  const isLightTheme = useThemeStore((state) => state.theme === "light");
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Upload a dataset to see a bar chart.</div>;
  }

  const groups = summarizeByGroup(data, analysis)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const maxValue = Math.max(...groups.map((group) => group.total), 1);
  const ticks = Array.from({ length: 5 }, (_, index) => (maxValue * index) / 4);
  const graphNodes = datasetToGraph(data, analysis);
  const groupColumn = analysis?.groupColumn;

  function selectGroup(groupName: string) {
    const rowIndex = data.findIndex((row) => (groupColumn ? row[groupColumn] || "Unknown" : "All") === groupName);

    setHoveredGroup(null);

    if (rowIndex >= 0) setSelectedNode(graphNodes[rowIndex]);
  }

  return (
    <div className="relative flex h-full w-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bar Chart</h3>
        <span className="text-xs text-slate-400">Top groups · hover a bar for details</span>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`flex w-24 shrink-0 items-stretch pb-9 pr-2 pt-3 text-[10px] ${isLightTheme ? "text-slate-900" : "text-slate-300"}`}>
          <span className={`mr-2 flex items-center text-center text-[10px] font-semibold [writing-mode:vertical-rl] rotate-180 ${isLightTheme ? "text-black" : "text-slate-200"}`}>
            {analysis?.valueColumn ?? "Value"}
          </span>
          <div className={`flex flex-1 flex-col justify-between text-right ${isLightTheme ? "text-slate-900" : "text-slate-400"}`}>
            {[...ticks].reverse().map((tick) => <span key={tick}>{formatValue(analysis?.valueColumn ?? null, tick)}</span>)}
          </div>
        </div>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-x-0 bottom-9 top-3 flex flex-col justify-between">
            {ticks.map((tick) => <div key={tick} className="border-t border-dashed border-slate-700" />)}
          </div>
          <div className="flex h-full min-h-0 flex-1 items-end gap-3 overflow-x-auto pb-2">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.group} className="flex h-full min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
              <div className="relative z-10 flex h-[calc(100%-1.75rem)] w-full items-end justify-center rounded-t-xl bg-slate-800/30 p-1">
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={`${group.group}: ${formatValue(analysis?.valueColumn ?? null, group.total)}, ${group.count} rows`}
                  onMouseEnter={() => setHoveredGroup(group.group)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  onFocus={() => setHoveredGroup(group.group)}
                  onBlur={() => setHoveredGroup(null)}
                  onClick={() => selectGroup(group.group)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectGroup(group.group);
                    }
                  }}
                  title={`${group.group}: ${formatValue(analysis?.valueColumn ?? null, group.total)} (${group.count} rows)`}
                  className={`w-full border-0 p-0 rounded-t-lg bg-gradient-to-t from-violet-600 via-violet-500 to-cyan-400 shadow-[0_0_18px_rgba(168,85,247,0.3)] ${hoveredGroup === group.group || (selectedNode && data.some((row, index) => (groupColumn ? row[groupColumn] || "Unknown" : "All") === group.group && graphNodes[index]?.id === selectedNode.id)) ? "brightness-125 ring-2 ring-white" : ""}`}
                  style={{ height: `${Math.max((group.total / maxValue) * 100, 2)}%` }}
                />
              </div>

              <span className="max-w-full truncate text-center text-xs text-slate-300" title={group.group}>{group.group}</span>
            </div>
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No grouped data available.</div>
        )}
          </div>
          <div className={`absolute bottom-0 left-0 right-0 flex justify-center gap-2 text-xs font-semibold ${isLightTheme ? "text-black" : "text-slate-200"}`}>
            {analysis?.groupColumn ?? "Category"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarChart;
