import ThreeCanvas from "../components/ThreeCanvas/ThreeCanvas";
import InfoPanel from "../components/InfoPanel/InfoPanel";
import VisualizationModes from "../components/VisualizationModes/VisualizationModes";
import { useDatasetStore } from "../store/datasetStore";
import { useVisualizationStore } from "../store/visualizationStore";

function ThreeDWorkspace() {
  const { fileName, analysis } = useDatasetStore();
  const dimension = useVisualizationStore((state) => state.dimension);

  return (
    <div className="flex-1 flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-semibold">Graph Workspace</h2>

          <p className="text-sm text-slate-400">
            {fileName
              ? `Exploring ${fileName} in ${dimension.toUpperCase()}`
              : `Upload a dataset to populate the ${dimension.toUpperCase()} graph.`}
          </p>
        </div>

        {analysis && (
          <p className="text-sm text-slate-400">
            {analysis.rowCount.toLocaleString()} nodes • {analysis.columnCount} columns
          </p>
        )}
      </div>

      <VisualizationModes />

      <div className="relative flex flex-1 min-h-[420px]">
        <ThreeCanvas />

        <InfoPanel />
      </div>
    </div>
  );
}

export default ThreeDWorkspace;
