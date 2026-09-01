import { useDatasetStore } from "../../store/datasetStore";
import { getColorForIndex } from "../../utils/colors";

function Legend() {
  const { data, analysis } = useDatasetStore();

  if (!data || data.length === 0 || !analysis) return null;

  const groupColumn = analysis.groupColumn;
  const groups = groupColumn ? Array.from(new Set(data.map((row) => row[groupColumn] || "Unknown"))) : [];

  return (
    <div className="mt-6 border-t border-slate-700 pt-5">
      <h3 className="text-sm font-semibold text-violet-300 mb-3">How to read the graph</h3>

      <div className="space-y-4 text-slate-300">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Node size = {analysis.valueColumn ?? "value"}</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span className="text-xs">Low</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-slate-400" />
              <span className="text-xs">Moderate</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block h-5 w-5 shrink-0 rounded-full bg-slate-400" />
              <span className="text-xs">High</span>
            </div>
          </div>
        </div>

        {groups.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Node color = {groupColumn}</p>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {groups.map((group, index) => (
                <div key={group} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getColorForIndex(index) }} />
                  <span className="text-xs">{group}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Ring around a node = rank (the fill color above always stays {groupColumn ?? "the category"})
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#facc15]" />
              <span className="text-xs">Highest performer</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#f43f5e]" />
              <span className="text-xs">Lowest performer</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#c084fc]" />
              <span className="text-xs">Notable (2nd / 3rd)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#38bdf8]" />
              <span className="text-xs">Top {groupColumn ?? "group"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white" />
              <span className="text-xs">Selected / hovered</span>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">A node can show more than one ring at once — rings nest, they don't replace each other.</p>
        </div>
      </div>
    </div>
  );
}

export default Legend;
