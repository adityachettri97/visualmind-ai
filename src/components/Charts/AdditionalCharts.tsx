import { formatValue } from "../../utils/datasetToGraph";
import { useDatasetStore } from "../../store/datasetStore";
import { useNodeStore } from "../../store/nodeStore";
import { datasetToGraph } from "../../utils/datasetToGraph";
import { getColorForIndex } from "../../utils/colors";
import { useThemeStore } from "../../store/themeStore";
import type { TwoDVisualizationMode } from "../../store/visualizationStore";

interface ChartPoint {
  label: string;
  value: number;
}

function AdditionalCharts({ mode }: { mode: Exclude<TwoDVisualizationMode, "bar" | "heatmap" | "treemap"> }) {
  const { data, analysis } = useDatasetStore();
  const { selectedNode, setSelectedNode } = useNodeStore();
  const isLightTheme = useThemeStore((state) => state.theme === "light");
  const valueColumn = analysis?.valueColumn ?? null;
  const groupColumn = analysis?.groupColumn ?? analysis?.labelColumn ?? null;
  const graphNodes = datasetToGraph(data, analysis);
  const groupedValues = new Map<string, number>();

  if (data.length > 0 && valueColumn) {
    data.forEach((row, index) => {
      const label = groupColumn ? row[groupColumn] || "Unknown" : `Row ${index + 1}`;
      groupedValues.set(label, (groupedValues.get(label) ?? 0) + (Number(row[valueColumn]) || 0));
    });
  }

  const points: ChartPoint[] = Array.from(groupedValues, ([label, value]) => ({ label, value }));

  function selectRecord(label: string, excludedLabels: string[] = []) {
    const rowIndex = groupColumn
      ? data.findIndex((row) => {
          const rowLabel = row[groupColumn] || "Unknown";

          return label === "Other" ? !excludedLabels.includes(rowLabel) : rowLabel === label;
        })
      : 0;

    if (rowIndex >= 0 && graphNodes[rowIndex]) setSelectedNode(graphNodes[rowIndex]);
  }

  if (data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Upload a dataset to view this chart.</div>;
  }

  if (mode === "scatter") {
    const numericColumns = analysis?.numericColumns ?? [];
    const xColumn = numericColumns[0];
    const yColumn = numericColumns[1];

    if (!xColumn || !yColumn) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <h3 className="text-lg font-semibold">Scatter plot</h3>
          <p className="text-sm text-slate-400">A scatter plot needs at least two numeric columns.</p>
        </div>
      );
    }

    const plot = data
      .map((row, index) => ({
        rowIndex: index,
        label: groupColumn ? row[groupColumn] || `Row ${index + 1}` : `Row ${index + 1}`,
        x: Number(row[xColumn]),
        y: Number(row[yColumn]),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .slice(0, 500);

    if (plot.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <h3 className="text-lg font-semibold">Scatter plot</h3>
          <p className="text-sm text-slate-400">No rows contain valid numbers in both {xColumn} and {yColumn}.</p>
        </div>
      );
    }

    const xMin = Math.min(...plot.map((point) => point.x));
    const xMax = Math.max(...plot.map((point) => point.x));
    const yMin = Math.min(...plot.map((point) => point.y));
    const yMax = Math.max(...plot.map((point) => point.y));
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const xTickValues = Array.from({ length: 5 }, (_, index) => xMin + (xRange * index) / 4);
    const yTickValues = Array.from({ length: 5 }, (_, index) => yMin + (yRange * index) / 4);

    return (
      <div className="relative flex h-full w-full flex-col p-4">
        <h3 className="text-lg font-semibold">Scatter plot</h3>
        <p className="text-xs text-slate-400">Each dot is a record · hover or focus a dot for exact values · showing {plot.length} records</p>
        <svg className="min-h-0 flex-1" viewBox="0 0 900 480" role="img" aria-label={`Scatter plot of ${yColumn} against ${xColumn}`}>
          {yTickValues.map((value, index) => {
            const y = 370 - index * 78;

            return (
              <g key={index}>
                <line x1="132" y1={y} x2="860" y2={y} stroke="currentColor" className="text-slate-700" strokeDasharray="4 6" />
                <text x="120" y={y + 4} textAnchor="end" className={`${isLightTheme ? "fill-slate-900" : "fill-slate-300"} text-[12px]`}>{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
              </g>
            );
          })}
          <line x1="132" y1="58" x2="132" y2="370" stroke="currentColor" className="text-slate-400" />
          <line x1="132" y1="370" x2="860" y2="370" stroke="currentColor" className="text-slate-400" />
          {plot.map((point, index) => {
            const cx = 140 + ((point.x - xMin) / xRange) * 710;
            const cy = 360 - ((point.y - yMin) / yRange) * 290;

            return (
              <circle
                key={`${point.label}-${index}`}
                cx={cx}
                cy={cy}
                r="6"
                tabIndex={0}
                role="img"
                aria-label={`${point.label}: ${xColumn} ${point.x}, ${yColumn} ${point.y}`}
                fill={getColorForIndex(index)}
                fillOpacity="0.9"
                onClick={() => setSelectedNode(graphNodes[point.rowIndex] ?? null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedNode(graphNodes[point.rowIndex] ?? null);
                  }
                }}
                className={`cursor-pointer outline-none focus:stroke-white focus:stroke-[3px] ${selectedNode?.id === graphNodes[point.rowIndex]?.id ? "stroke-white stroke-[3px]" : ""}`}
              >
                <title>{`${point.label} · ${xColumn}: ${point.x.toLocaleString()} · ${yColumn}: ${point.y.toLocaleString()}`}</title>
              </circle>
            );
          })}
          {xTickValues.map((value, index) => {
            const x = 140 + index * (710 / 4);

            return (
              <text key={index} x={x} y="390" textAnchor="middle" className={`${isLightTheme ? "fill-slate-900" : "fill-slate-300"} text-[12px]`}>
                {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </text>
            );
          })}
          <text x="500" y="438" textAnchor="middle" className={`${isLightTheme ? "fill-black" : "fill-white"} text-[14px] font-semibold`}>{xColumn}</text>
          <text x="25" y="220" textAnchor="middle" transform="rotate(-90 25 220)" className={`${isLightTheme ? "fill-black" : "fill-white"} text-[14px] font-semibold`}>{yColumn}</text>
        </svg>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <h3 className="text-lg font-semibold">{mode === "line" ? "Line chart" : mode === "donut" ? "Donut chart" : "Horizontal bar chart"}</h3>
        <p className="text-sm text-slate-400">Choose a dataset with a numeric column to use this chart.</p>
      </div>
    );
  }

  if (mode === "horizontalBar") {
    const shownPoints = [...points].sort((a, b) => b.value - a.value).slice(0, 12);
    const maxValue = Math.max(...shownPoints.map((point) => point.value), 1);

    const ticks = Array.from({ length: 5 }, (_, index) => (maxValue * index) / 4);
    return (
      <div className="glass-scrollbar flex h-full w-full flex-col gap-3 overflow-y-auto p-4">
        <div>
          <h3 className="text-lg font-semibold">Horizontal bar chart</h3>
          <p className="text-xs text-slate-400">Bar length = {valueColumn} · hover or focus a bar for details</p>
        </div>
        {shownPoints.map((point, index) => (
          <div key={point.label} className="grid grid-cols-[minmax(5rem,1fr)_3fr_auto] items-center gap-3 text-xs">
            <span className="truncate text-slate-300" title={point.label}>{point.label}</span>
            <div className="h-5 overflow-hidden rounded bg-slate-800">
              <button
                type="button"
                tabIndex={0}
                aria-label={`${point.label}: ${formatValue(valueColumn, point.value)}`}
                onClick={() => selectRecord(point.label)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectRecord(point.label);
                  }
                }}
                title={`${point.label} · ${formatValue(valueColumn, point.value)}`}
                className={`h-full cursor-pointer rounded bg-gradient-to-r from-violet-600 to-cyan-400 outline-none focus:ring-2 focus:ring-white ${data.some((row, rowIndex) => (groupColumn ? row[groupColumn] || "Unknown" : `Row ${rowIndex + 1}`) === point.label && graphNodes[rowIndex]?.id === selectedNode?.id) ? "ring-2 ring-white brightness-125" : ""}`}
                style={{ width: `${Math.max((point.value / maxValue) * 100, 1)}%`, opacity: 1 - index * 0.035 }}
              >
                <span className="sr-only">Select record from {point.label}</span>
              </button>
            </div>
            <span className="text-right text-slate-400">{formatValue(valueColumn, point.value)}</span>
          </div>
        ))}
        <div className="ml-[calc(25%+0.75rem)] mr-16">
          <div className={`flex justify-between border-t border-slate-500 pt-1 text-[10px] ${isLightTheme ? "text-slate-900" : "text-slate-400"}`}>
            {ticks.map((tick) => <span key={tick}>{formatValue(valueColumn, tick)}</span>)}
          </div>
          <p className={`mt-1 text-center text-xs font-semibold ${isLightTheme ? "text-black" : "text-slate-200"}`}>{valueColumn}</p>
        </div>
      </div>
    );
  }

  if (mode === "donut") {
    const positivePoints = points.filter((point) => point.value > 0).sort((a, b) => b.value - a.value);

    if (positivePoints.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <h3 className="text-lg font-semibold">Donut chart</h3>
          <p className="text-sm text-slate-400">A donut chart needs positive values in the selected numeric column.</p>
        </div>
      );
    }

    const top = positivePoints.slice(0, 6);
    const remainder = positivePoints.slice(6).reduce((sum, point) => sum + point.value, 0);
    const otherLabels = positivePoints.slice(6).map((point) => point.label);
    const slices = remainder > 0 ? [...top, { label: "Other", value: remainder }] : top;
    const total = slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0);
    const gradient = slices.map((slice, index) => {
      const start = slices.slice(0, index).reduce((sum, previous) => sum + (total > 0 ? (Math.max(previous.value, 0) / total) * 100 : 0), 0);
      const end = start + (total > 0 ? (Math.max(slice.value, 0) / total) * 100 : 0);

      return `${getColorForIndex(index)} ${start}% ${end}%`;
    }).join(", ");

    return (
      <div className="glass-scrollbar flex h-full w-full flex-col items-center justify-center gap-5 overflow-auto p-4 sm:flex-row sm:gap-10">
        <div className="relative h-56 w-56 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label="Donut chart showing shares by category">
          <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-slate-950 text-center">
            <span className="text-xs text-slate-400">Total</span>
            <span className="max-w-full truncate px-2 text-lg font-semibold">{formatValue(valueColumn, total)}</span>
          </div>
        </div>
        <div className="flex max-h-full min-w-40 flex-col gap-2 overflow-y-auto">
          <h3 className="text-lg font-semibold">Donut chart</h3>
          {slices.map((slice, index) => (
            <button
              type="button"
              key={slice.label}
              tabIndex={0}
              onClick={() => selectRecord(slice.label, otherLabels)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectRecord(slice.label, otherLabels);
                }
              }}
              title={`${slice.label} · ${formatValue(valueColumn, slice.value)} · ${((slice.value / total) * 100).toFixed(1)}%`}
              className={`flex cursor-pointer items-center gap-2 rounded border-0 bg-transparent p-1 text-left text-sm outline-none focus:ring-2 focus:ring-violet-400 ${data.some((row, rowIndex) => (groupColumn ? row[groupColumn] || "Unknown" : `Row ${rowIndex + 1}`) === slice.label && graphNodes[rowIndex]?.id === selectedNode?.id) ? "ring-2 ring-white" : ""}`}
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: getColorForIndex(index) }} />
              <span className="max-w-40 truncate text-slate-300">{slice.label}</span>
              <span className="ml-auto text-slate-400">{total > 0 ? `${((Math.max(slice.value, 0) / total) * 100).toFixed(1)}%` : "0%"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const linePoints = points.slice(0, 24);
  const minValue = Math.min(...linePoints.map((point) => point.value), 0);
  const maxValue = Math.max(...linePoints.map((point) => point.value), 1);
  const range = maxValue - minValue || 1;
  const chartPoints = linePoints.map((point, index) => ({
    ...point,
    x: linePoints.length <= 1 ? 496 : 140 + (index / (linePoints.length - 1)) * 710,
    y: 340 - ((point.value - minValue) / range) * 290,
  }));
  const valueTicks = Array.from({ length: 5 }, (_, index) => minValue + (range * index) / 4);
  const xTickStride = Math.max(1, Math.ceil(chartPoints.length / 8));
  return (
    <div className="relative flex h-full w-full flex-col p-4">
      <h3 className="text-lg font-semibold">Line chart</h3>
      <p className="text-xs text-slate-400">Line height = {valueColumn} · hover or focus a point for exact values</p>
      <svg className="min-h-0 flex-1" viewBox="0 0 900 480" role="img" aria-label={`Line chart of ${valueColumn} by ${groupColumn ?? "row order"}`}>
        {valueTicks.map((value, index) => {
          const y = 370 - index * 78;

          return (
            <g key={index}>
              <line x1="132" y1={y} x2="860" y2={y} stroke="currentColor" className="text-slate-700" strokeDasharray="4 6" />
              <text x="120" y={y + 4} textAnchor="end" className={`${isLightTheme ? "fill-slate-900" : "fill-slate-300"} text-[12px]`}>{formatValue(valueColumn, value)}</text>
            </g>
          );
        })}
        <line x1="132" y1="58" x2="132" y2="370" stroke="currentColor" className="text-slate-400" />
        <line x1="132" y1="370" x2="860" y2="370" stroke="currentColor" className="text-slate-400" />
        <polyline points={chartPoints.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {chartPoints.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              tabIndex={0}
              role="img"
              aria-label={`${point.label}: ${formatValue(valueColumn, point.value)}`}
              onClick={() => selectRecord(point.label)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectRecord(point.label);
                }
              }}
              fill="#22d3ee"
              className={`cursor-pointer outline-none focus:stroke-white focus:stroke-[3px] ${data.some((row, rowIndex) => (groupColumn ? row[groupColumn] || "Unknown" : `Row ${rowIndex + 1}`) === point.label && graphNodes[rowIndex]?.id === selectedNode?.id) ? "stroke-white stroke-[3px]" : ""}`}
            >
              <title>{`${point.label} · ${valueColumn}: ${formatValue(valueColumn, point.value)}`}</title>
            </circle>
            {chartPoints.length <= 8 || chartPoints.indexOf(point) % xTickStride === 0 ? (
              <text x={point.x} y="394" textAnchor="middle" className={`${isLightTheme ? "fill-slate-900" : "fill-slate-300"} text-[11px]`}>
                {point.label.length > 12 ? `${point.label.slice(0, 11)}…` : point.label}
              </text>
            ) : null}
          </g>
        ))}
        <text x="500" y="440" textAnchor="middle" className={`${isLightTheme ? "fill-black" : "fill-white"} text-[14px] font-semibold`}>{groupColumn ?? "Row order"}</text>
        <text x="25" y="220" textAnchor="middle" transform="rotate(-90 25 220)" className={`${isLightTheme ? "fill-black" : "fill-white"} text-[14px] font-semibold`}>{valueColumn ?? "Value"}</text>
      </svg>
    </div>
  );
}

export default AdditionalCharts;
