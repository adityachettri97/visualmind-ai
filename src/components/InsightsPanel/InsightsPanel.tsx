import { motion } from "framer-motion";
import { Loader2, TriangleAlert } from "lucide-react";
import { slideRight } from "../../animations";
import Metrics from "../Metrics/Metrics";
import Legend from "./Legend";
import { useDatasetStore } from "../../store/datasetStore";
import { analyzeWithAI } from "../../services/aiService";

function InsightsPanel() {
  const { data, aiAnalysis, aiStatus, aiError, setAIAnalysis, setAILoading, setAIError } = useDatasetStore();

  const handleRetry = () => {
    setAILoading();

    analyzeWithAI(data)
      .then((result) => setAIAnalysis(result))
      .catch((error) => setAIError(error instanceof Error ? error.message : "Failed to analyze dataset with AI."));
  };

  return (
    <motion.div variants={slideRight} initial="hidden" animate="visible" className="w-full shrink-0 lg:w-[19rem] xl:w-[20rem] flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-700 bg-[#0B1220] p-4">
        <h2 className="glass glass-hover p-3 text-xl font-bold mb-4">AI Insights</h2>

        {aiAnalysis ? (
          <>
            {aiAnalysis.insights.length > 0 ? (
              <ul className="space-y-3 text-slate-300">
                {aiAnalysis.insights.map((insight, index) => (
                  <li key={index}>💡 {insight}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No notable insights for this dataset.</p>
            )}

            <div className="mt-6 border-t border-slate-700 pt-5">
              <h3 className="text-sm font-semibold text-violet-300 mb-3">AI Recommendations</h3>

              {aiAnalysis.recommendations.length > 0 ? (
                <ul className="space-y-3 text-slate-300">
                  {aiAnalysis.recommendations.map((recommendation, index) => (
                    <li key={index}>🤖 {recommendation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No recommendations for this dataset.</p>
              )}
            </div>

            {aiAnalysis.dataQuality &&
              (aiAnalysis.dataQuality.issues.length > 0 || aiAnalysis.dataQuality.suggestions.length > 0) && (
                <div
                  className={`mt-6 rounded-xl border p-4 ${
                    aiAnalysis.dataQuality.rating === "poor" ? "border-red-500/40 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"
                  }`}
                >
                  <h3
                    className={`mb-3 flex items-center gap-1.5 text-sm font-semibold ${
                      aiAnalysis.dataQuality.rating === "poor" ? "text-red-300" : "text-amber-300"
                    }`}
                  >
                    <TriangleAlert size={15} />
                    Improve this dataset
                  </h3>

                  {aiAnalysis.dataQuality.issues.length > 0 && (
                    <ul className="space-y-1.5 text-sm text-slate-300">
                      {aiAnalysis.dataQuality.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  )}

                  {aiAnalysis.dataQuality.suggestions.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-sm text-slate-300">
                      {aiAnalysis.dataQuality.suggestions.map((suggestion, index) => (
                        <li key={index}>✓ {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
          </>
        ) : aiStatus === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Analyzing dataset with AI...
          </div>
        ) : aiStatus === "error" ? (
          <div>
            <p className="text-sm text-red-400">{aiError ?? "AI analysis failed."}</p>

            <button onClick={handleRetry} className="mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium hover:bg-violet-700 transition">
              Retry
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Upload a dataset to generate AI insights.</p>
        )}

        <Legend />
      </div>

      <Metrics />
    </motion.div>
  );
}

export default InsightsPanel;
