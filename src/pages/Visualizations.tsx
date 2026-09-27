import { useDatasetStore } from "../store/datasetStore";
import { datasetToGraph, formatValue, summarizeByGroup } from "../utils/datasetToGraph";

function Visualizations() {
  const { data, analysis, fileName } = useDatasetStore();

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Visualizations</h2>

          <p className="text-sm text-slate-400">Upload a dataset to see it broken down visually.</p>
        </div>
      </div>
    );
  }

  const nodes = datasetToGraph(data, analysis);
  const topNodes = [...nodes].sort((a, b) => b.sizeFactor - a.sizeFactor).slice(0, 10);
  const groups = summarizeByGroup(data, analysis);
  const topGroups = [...groups].sort((a, b) => b.total - a.total).slice(0, 6);
  const maxGroupTotal = Math.max(...groups.map((group) => group.total), 1);

  return (
    <div className="flex-1 overflow-y-auto glass-scrollbar flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h2 className="text-xl font-semibold">Visualizations</h2>

        <p className="text-sm text-slate-400">{fileName ? `Breakdown of ${fileName}` : ""}</p>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-4">Top by Value</h3>

        <div className="space-y-3">
          {topNodes.map((node) => (
            <div key={node.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{node.label}</span>

                <span className="text-slate-400">{node.value}</span>
              </div>

              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(node.sizeFactor * 100, 4)}%`, backgroundColor: node.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {topGroups.length > 0 && (
        <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
          <h3 className="text-lg font-semibold mb-4">Bar Chart</h3>

          <div className="flex h-48 items-end gap-3 overflow-x-auto pb-2">
            {topGroups.map((group) => (
              <div key={group.group} className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
                <span className="text-center text-[10px] text-slate-400">{formatValue(analysis?.valueColumn ?? null, group.total)}</span>

                <div className="flex h-32 w-full items-end justify-center rounded-t-xl bg-slate-800/70 p-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 via-violet-500 to-cyan-400"
                    style={{ height: `${Math.max((group.total / maxGroupTotal) * 100, 12)}%` }}
                  />
                </div>

                <span className="max-w-full truncate text-center text-xs text-slate-300">{group.group}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
          <h3 className="text-lg font-semibold mb-4">Breakdown by Group</h3>

          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.group}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{group.group}</span>

                  <span className="text-slate-400">{group.count.toLocaleString()} items</span>
                </div>

                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${(group.total / maxGroupTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Visualizations;
