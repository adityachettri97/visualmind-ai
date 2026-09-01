import { motion } from "framer-motion";
import { hoverScale, tapScale } from "../../animations";
import { useDatasetStore } from "../../store/datasetStore";
import { computeValueTotal, formatValue } from "../../utils/datasetToGraph";

function Metrics() {
  const { data, analysis } = useDatasetStore();

  const total = computeValueTotal(data, analysis);
  const orderCount = data.length;

  const cards = [
    {
      title: "Total Value",
      value: formatValue(analysis?.valueColumn ?? null, total),
    },
    {
      title: "Orders",
      value: orderCount.toLocaleString(),
    },
    {
      title: "Columns",
      value: analysis?.columnCount.toLocaleString() ?? "0",
    },
    {
      title: "Rows",
      value: analysis?.rowCount.toLocaleString() ?? "0",
    },
  ];

  return (
    <motion.div whileHover={hoverScale} whileTap={tapScale} className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.title} className="glass glass-hover rounded-xl border border-slate-700 bg-[#131C31] p-4">
          <p className="text-slate-400 text-sm">{card.title}</p>

          <h2 className="text-2xl font-bold mt-2">{card.value}</h2>
        </div>
      ))}
    </motion.div>
  );
}

export default Metrics;
