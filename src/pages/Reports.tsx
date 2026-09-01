import { Loader2 } from "lucide-react";
import { useDatasetStore } from "../store/datasetStore";
import { computeValueTotal, formatValue, summarizeByGroup } from "../utils/datasetToGraph";

function Reports() {
  const { data, fileName, analysis, aiAnalysis, aiStatus, aiError } = useDatasetStore();

  const hasData = data.length > 0;
  const total = hasData ? computeValueTotal(data, analysis) : 0;
  const groups = hasData ? summarizeByGroup(data, analysis) : [];

  return (
    <div className="flex-1 overflow-y-auto glass-scrollbar flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>

          <p className="text-sm text-slate-400">{hasData ? `Summary report for ${fileName}` : "Upload a dataset to generate a report."}</p>
        </div>

        {hasData && (
          <button
            onClick={() => window.print()}
            className="print:hidden rounded-lg bg-violet-600 px-4 py-2 hover:bg-violet-700 transition text-sm font-medium"
          >
            Print / Export
          </button>
        )}
      </div>

      {hasData && (
        <>
          <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
            <h3 className="text-lg font-semibold mb-4">Overview</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">Rows</p>

                <p className="text-2xl font-bold mt-1">{analysis?.rowCount.toLocaleString() ?? 0}</p>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">Columns</p>

                <p className="text-2xl font-bold mt-1">{analysis?.columnCount ?? 0}</p>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">Total Value</p>

                <p className="text-2xl font-bold mt-1">{formatValue(analysis?.valueColumn ?? null, total)}</p>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">Groups</p>

                <p className="text-2xl font-bold mt-1">{groups.length}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
            <h3 className="text-lg font-semibold mb-4">AI Insights</h3>

            {aiAnalysis ? (
              <ul className="space-y-2 text-sm text-slate-300">
                {aiAnalysis.insights.map((insight, index) => (
                  <li key={index}>💡 {insight}</li>
                ))}
              </ul>
            ) : aiStatus === "loading" ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Analyzing dataset with AI...
              </div>
            ) : aiStatus === "error" ? (
              <p className="text-sm text-red-400">{aiError ?? "AI analysis failed."}</p>
            ) : (
              <p className="text-sm text-slate-500">AI insights aren't available yet. Try re-uploading the dataset.</p>
            )}
          </div>

          <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
            <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>

            {aiAnalysis ? (
              <ul className="space-y-2 text-sm text-slate-300">
                {aiAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index}>🤖 {recommendation}</li>
                ))}
              </ul>
            ) : aiStatus === "loading" ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Analyzing dataset with AI...
              </div>
            ) : aiStatus === "error" ? (
              <p className="text-sm text-red-400">{aiError ?? "AI analysis failed."}</p>
            ) : (
              <p className="text-sm text-slate-500">No recommendations available yet.</p>
            )}
          </div>

          {groups.length > 0 && (
            <div className="glass rounded-2xl p-4 sm:p-5 overflow-x-auto glass-scrollbar shrink-0">
              <h3 className="text-lg font-semibold mb-4">Breakdown by Group</h3>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="py-2 pr-4">Group</th>

                    <th className="py-2 pr-4">Items</th>

                    <th className="py-2 pr-4">Total</th>

                    <th className="py-2">Share</th>
                  </tr>
                </thead>

                <tbody>
                  {groups.map((group) => (
                    <tr key={group.group} className="border-b border-slate-800">
                      <td className="py-2 pr-4">{group.group}</td>

                      <td className="py-2 pr-4">{group.count}</td>

                      <td className="py-2 pr-4">{formatValue(analysis?.valueColumn ?? null, group.total)}</td>

                      <td className="py-2">{total > 0 ? `${((group.total / total) * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;
