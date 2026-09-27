import { useDatasetStore } from "../../store/datasetStore";
import { formatValue, summarizeByGroup } from "../../utils/datasetToGraph";

function BarChart() {
  const { data, analysis } = useDatasetStore();

  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Upload a dataset to see a bar chart.</div>;
  }

  const groups = summarizeByGroup(data, analysis).sort((a, b) => b.total - a.total).slice(0, 8);
  const maxValue = Math.max(...groups.map((group) => group.total), 1);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bar Chart</h3>
        <span className="text-xs text-slate-400">Top groups</span>
      </div>

      <div className="flex h-full min-h-0 flex-1 items-end gap-3 overflow-x-auto pb-2">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.group} className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
              <span className="text-center text-[10px] text-slate-400">{formatValue(analysis?.valueColumn ?? null, group.total)}</span>

              <div className="flex h-40 w-full items-end justify-center rounded-t-xl bg-slate-800/70 p-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 via-violet-500 to-cyan-400 shadow-[0_0_18px_rgba(168,85,247,0.45)]"
                  style={{ height: `${Math.max((group.total / maxValue) * 100, 14)}%` }}
                />
              </div>

              <span className="max-w-full truncate text-center text-xs text-slate-300">{group.group}</span>
            </div>
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No grouped data available.</div>
        )}
      </div>
    </div>
  );
}

export default BarChart;
