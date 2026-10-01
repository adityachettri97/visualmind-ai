import { motion, AnimatePresence } from "framer-motion";
import { useNodeStore } from "../../store/nodeStore";
import { MapPin, FileText, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { getCurrencyMetaForRegion } from "../../utils/currency";

function InfoPanel() {
  const { selectedNode, setSelectedNode } = useNodeStore();
  const userRegion = useAuthStore((state) => state.user?.region ?? null);
  const currencySymbol = getCurrencyMetaForRegion(userRegion).symbol;

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          initial={{
            opacity: 0,
            x: 350,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            x: 350,
          }}
          transition={{
            duration: 0.35,
          }}
          className="record-info-panel glass-scrollbar absolute left-4 right-4 top-4 z-50 max-h-[50vh] overflow-y-auto rounded-[22px] border border-slate-700/80 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.14),transparent_48%),rgba(7,19,38,0.96)] p-4 shadow-[0_24px_80px_rgba(2,6,23,0.9)] backdrop-blur-xl before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-cyan-300/70 before:to-transparent sm:left-auto sm:right-6 sm:top-6 sm:w-[20rem] sm:max-h-[85vh] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/80">Selected record</p>
              <h2 className="wrap-break-word text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">{selectedNode.label}</h2>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              aria-label="Close record details"
              className="shrink-0 rounded-full border border-white/10 bg-white/4 p-2 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="my-5 h-px bg-linear-to-r from-cyan-200/30 via-slate-600/70 to-transparent" />
          <div className="space-y-5">
            <div className="rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3.5">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-lg font-semibold leading-none text-cyan-200">
                  {currencySymbol}
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Value</p>
              </div>

              <h3 className="mt-2 text-3xl font-bold leading-none text-white">{selectedNode.value}</h3>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={16} />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Region</p>
              </div>

              <h3 className="mt-1.5 wrap-break-word text-xl font-semibold leading-snug text-white">
                {selectedNode.summary.split(" in ").pop()?.replace(".", "") || "Unknown"}
              </h3>
            </div>

            <div className="border-t border-slate-700/80 pt-4">
              <div className="flex items-center gap-2 text-slate-400">
                <FileText size={16} />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">AI Summary</p>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedNode.summary}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InfoPanel;
