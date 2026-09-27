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
          className="glass-scrollbar absolute left-4 right-4 top-4 z-50 max-h-[50vh] overflow-y-auto rounded-[22px] border border-slate-700/80 bg-[#071326]/90 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.9)] backdrop-blur-xl sm:left-auto sm:right-6 sm:top-6 sm:w-[20rem] sm:max-h-[85vh] sm:bg-[#071326]/90 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[clamp(1.75rem,3vw,2.4rem)] font-black tracking-[-0.04em] text-white">{selectedNode.label}</h2>

            <button onClick={() => setSelectedNode(null)} className="rounded-lg p-2 text-slate-200 transition hover:bg-slate-700/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <hr className="my-5 border-slate-700" />
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[1.6rem] font-semibold leading-none text-white">{currencySymbol}</span>
                <p className="text-base">Value</p>
              </div>

              <h3 className="mt-2 text-[clamp(1.4rem,2vw,2rem)] font-semibold tracking-[-0.04em] text-white">{selectedNode.value}</h3>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={16} />
                <p className="text-base">Region</p>
              </div>

              <h3 className="mt-2 text-[clamp(1.4rem,2vw,2rem)] font-semibold tracking-[-0.04em] text-white">
                {selectedNode.summary.split(" in ").pop()?.replace(".", "") || "Unknown"}
              </h3>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 text-slate-400">
                <FileText size={16} />
                <p className="text-base">AI Summary</p>
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
