import { motion, AnimatePresence } from "framer-motion";
import { useNodeStore } from "../../store/nodeStore";
import { DollarSign, MapPin, FileText, X } from "lucide-react";

function InfoPanel() {
  const { selectedNode, setSelectedNode } = useNodeStore();

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
          className="
glass
glass-scrollbar
absolute
top-4
right-4
left-4
sm:left-auto
w-auto
sm:top-6
sm:right-6
sm:w-80
max-h-[50vh]
sm:max-h-[85vh]
overflow-y-auto
rounded-2xl
p-4
sm:p-6
z-50
"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{selectedNode.label}</h2>

            <button onClick={() => setSelectedNode(null)} className="rounded-lg p-2 hover:bg-slate-700 transition">
              <X size={18} />
            </button>
          </div>
          <hr className="my-5 border-slate-700" />
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-slate-400">
                <DollarSign size={16} />
                <p>Value</p>
              </div>

              <h3 className="text-lg font-semibold">{selectedNode.value}</h3>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={16} />
                <p>Region</p>
              </div>

              <h3 className="text-lg font-semibold">{selectedNode.summary.split(" in ").pop()?.replace(".", "") || "Unknown"}</h3>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 text-slate-400">
                <FileText size={16} />
                <p>AI Summary</p>
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
