import ThreeCanvas from "../components/ThreeCanvas/ThreeCanvas";
import InfoPanel from "../components/InfoPanel/InfoPanel";
import { useDatasetStore } from "../store/datasetStore";

function ThreeDWorkspace() {
  const { fileName, analysis } = useDatasetStore();

  return (
    <div className="flex-1 flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-semibold">3D Workspace</h2>

          <p className="text-sm text-slate-400">{fileName ? `Exploring ${fileName}` : "Upload a dataset to populate the 3D graph."}</p>
        </div>

        {analysis && (
          <p className="text-sm text-slate-400">
            {analysis.rowCount.toLocaleString()} nodes • {analysis.columnCount} columns
          </p>
        )}
      </div>

      <div className="relative flex flex-1 min-h-[420px]">
        <ThreeCanvas />

        <InfoPanel />
      </div>
    </div>
  );
}

export default ThreeDWorkspace;
