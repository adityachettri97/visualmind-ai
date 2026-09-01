import { useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDatasetStore } from "../../store/datasetStore";
import { useFilterStore, isFilterActive, matchesFilters } from "../../store/filterStore";
import { useArrowKeyNav } from "../../hooks/useArrowKeyNav";

function FilterBar() {
  const { data, analysis } = useDatasetStore();
  const { searchQuery, selectedGroups, minValue, maxValue, setSearchQuery, toggleGroup, setValueRange, clearFilters } = useFilterStore();
  const [expanded, setExpanded] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);

  useArrowKeyNav(pillsRef, { orientation: "horizontal" });

  const groupColumn = analysis?.groupColumn ?? null;
  const labelColumn = analysis?.labelColumn ?? null;
  const valueColumn = analysis?.valueColumn ?? null;

  const groups = useMemo(() => {
    if (!groupColumn || !data) return [];

    return Array.from(new Set(data.map((row) => row[groupColumn] || "Unknown"))).sort();
  }, [data, groupColumn]);

  const valueBounds = useMemo(() => {
    if (!valueColumn || !data || data.length === 0) return null;

    const values = data.map((row) => Number(row[valueColumn]) || 0);

    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data, valueColumn]);

  const filters = useMemo(
    () => ({ searchQuery, selectedGroups, minValue, maxValue }),
    [searchQuery, selectedGroups, minValue, maxValue],
  );
  const filterActive = isFilterActive(filters);

  const matchCount = useMemo(() => {
    if (!data) return 0;

    return data.filter((row, index) => {
      const label = labelColumn ? row[labelColumn] || `Row ${index + 1}` : `Row ${index + 1}`;
      const group = groupColumn ? row[groupColumn] || "Unknown" : "All";
      const rawValue = valueColumn ? Number(row[valueColumn]) || 0 : 0;

      return matchesFilters(label, group, rawValue, filters);
    }).length;
  }, [data, labelColumn, groupColumn, valueColumn, filters]);

  // Not worth the screen real estate for small datasets — the whole point is finding a needle
  // in a large graph.
  if (!data || data.length < 8) return null;

  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2">
      <div className="glass flex flex-wrap items-center gap-2 rounded-xl px-3 py-2">
        <div className="flex min-w-35 flex-1 items-center gap-1.5">
          <Search size={14} className="shrink-0 text-slate-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Find a node by name..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
        </div>

        {(groups.length > 1 || valueBounds) && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            title="Filters"
            aria-label="Filters"
            aria-pressed={expanded}
            className={`relative flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors ${
              expanded ? "border-violet-500 text-white" : "border-white/10 text-slate-300 hover:border-violet-500 hover:text-white"
            }`}
          >
            <SlidersHorizontal size={14} />

            {selectedGroups.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] text-white">
                {selectedGroups.length}
              </span>
            )}
          </button>
        )}

        {filterActive && (
          <span className="text-xs text-slate-400">
            {matchCount} / {data.length} match
          </span>
        )}

        {filterActive && (
          <button
            type="button"
            onClick={clearFilters}
            title="Clear filters"
            aria-label="Clear filters"
            className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {expanded && (groups.length > 1 || valueBounds) && (
        <div className="glass flex flex-col gap-2 rounded-xl px-3 py-2">
          {groups.length > 1 && (
            <div ref={pillsRef} className="flex flex-wrap gap-1.5">
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    selectedGroups.includes(group)
                      ? "border-violet-500 bg-violet-500/30 text-white"
                      : "border-white/10 text-slate-300 hover:border-white/30"
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          )}

          {valueBounds && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="whitespace-nowrap">{valueColumn}:</span>

              <input
                type="number"
                value={minValue ?? ""}
                onChange={(event) => setValueRange(event.target.value === "" ? null : Number(event.target.value), maxValue)}
                placeholder={valueBounds.min.toLocaleString()}
                className="w-24 rounded border border-white/10 bg-white/5 px-1.5 py-1 text-white outline-none"
              />

              <span>to</span>

              <input
                type="number"
                value={maxValue ?? ""}
                onChange={(event) => setValueRange(minValue, event.target.value === "" ? null : Number(event.target.value))}
                placeholder={valueBounds.max.toLocaleString()}
                className="w-24 rounded border border-white/10 bg-white/5 px-1.5 py-1 text-white outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
