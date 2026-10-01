import { Download, Loader2, Printer } from "lucide-react";
import type { jsPDF as JsPDF } from "jspdf";
import { useDatasetStore } from "../store/datasetStore";
import { computeValueTotal, formatValue, summarizeByGroup } from "../utils/datasetToGraph";

function Reports() {
  const { data, fileName, analysis, aiAnalysis, aiStatus, aiError } = useDatasetStore();

  const hasData = data.length > 0;
  const total = hasData ? computeValueTotal(data, analysis) : 0;
  const groups = hasData ? summarizeByGroup(data, analysis) : [];

  async function downloadPdf() {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("VisualMind AI Report", 40, 48);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(fileName ?? "Dataset report", 40, 66);

    autoTable(pdf, {
      startY: 84,
      head: [["Overview", "Value"]],
      body: [
        ["Rows", String(analysis?.rowCount ?? 0)],
        ["Columns", String(analysis?.columnCount ?? 0)],
        ["Total Value", formatValue(analysis?.valueColumn ?? null, total)],
        ["Groups", String(groups.length)],
      ],
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    let cursorY = (pdf as JsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 190;
    const pageHeight = pdf.internal.pageSize.getHeight();

    function addTextSection(title: string, items: string[]) {
      if (items.length === 0) return;

      if (cursorY > pageHeight - 60) {
        pdf.addPage();
        cursorY = 48;
      }

      cursorY += 24;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(title, 40, cursorY);
      cursorY += 18;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      items.forEach((item) => {
        const lines = pdf.splitTextToSize(`- ${item}`, pageWidth - 80);
        const textHeight = lines.length * 14;

        if (cursorY + textHeight > pageHeight - 40) {
          pdf.addPage();
          cursorY = 48;
        }

        pdf.text(lines, 40, cursorY);
        cursorY += textHeight + 6;
      });
    }

    addTextSection("AI Insights", aiAnalysis?.insights ?? []);
    addTextSection("AI Recommendations", aiAnalysis?.recommendations ?? []);

    if (groups.length > 0) {
      autoTable(pdf, {
        startY: cursorY + 12,
        head: [["Group", "Items", "Total", "Share"]],
        body: groups.map((group) => [
          group.group,
          String(group.count),
          formatValue(analysis?.valueColumn ?? null, group.total),
          total > 0 ? `${((group.total / total) * 100).toFixed(1)}%` : "-",
        ]),
        margin: { left: 40, right: 40 },
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    pdf.save(`${fileName || "visualmind-report"}.pdf`);
  }

  return (
    <div className="flex-1 overflow-y-auto glass-scrollbar flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>

          <p className="text-sm text-slate-400">{hasData ? `Summary report for ${fileName}` : "Upload a dataset to generate a report."}</p>
        </div>

        {hasData && (
          <div className="print:hidden flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium transition hover:bg-slate-700/70"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={downloadPdf}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium transition hover:bg-violet-700"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
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
