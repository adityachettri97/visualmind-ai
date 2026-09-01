import { useEffect, useRef, useState } from "react";
import { Search, FileText } from "lucide-react";
import { useDatasetStore } from "../../store/datasetStore";
import { usePageStore } from "../../store/pageStore";
import { useArrowKeyNav } from "../../hooks/useArrowKeyNav";

interface SearchResult {
  id: string | "current";
  fileName: string;
  rowCount: number;
  columnCount: number;
  isCurrent: boolean;
}

function DatasetSearch() {
  const { fileName, analysis, history, loadFromHistory } = useDatasetStore();
  const { setActivePage } = usePageStore();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Vertical so it never fights the search input's own text-cursor Left/Right movement — Down
  // from the input moves into the first result, Up from the first result returns to the input.
  useArrowKeyNav(containerRef, { orientation: "vertical", loop: false });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allDatasets: SearchResult[] = [
    ...(fileName
      ? [
          {
            id: "current" as const,
            fileName,
            rowCount: analysis?.rowCount ?? 0,
            columnCount: analysis?.columnCount ?? 0,
            isCurrent: true,
          },
        ]
      : []),
    ...history.map((entry) => ({
      id: entry.id,
      fileName: entry.fileName,
      rowCount: entry.analysis.rowCount,
      columnCount: entry.analysis.columnCount,
      isCurrent: false,
    })),
  ];

  const results = query.trim() ? allDatasets.filter((d) => d.fileName.toLowerCase().includes(query.trim().toLowerCase())) : allDatasets;

  const handleSelect = (result: SearchResult) => {
    if (!result.isCurrent) {
      loadFromHistory(result.id);
    }

    setActivePage("dashboard");
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="hidden md:block flex-1 max-w-[420px] relative">
      <Search className="absolute left-3 top-3 text-slate-400" size={18} />

      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search datasets..."
        className="w-full rounded-lg bg-[#131C31] pl-10 pr-4 py-2 outline-none border border-slate-700 focus:border-violet-500"
      />

      {isOpen && (
        <div className="glass glass-scrollbar absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-700 p-2 z-50">
          {allDatasets.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No datasets yet — upload a CSV to get started.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No datasets match "{query}".</p>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-violet-500/15 transition"
              >
                <FileText size={16} className="shrink-0 text-slate-400" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{result.fileName}</p>

                  <p className="text-xs text-slate-500">
                    {result.rowCount.toLocaleString()} rows • {result.columnCount} columns
                    {result.isCurrent && " • current"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DatasetSearch;
