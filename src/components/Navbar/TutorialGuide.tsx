import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, ChartNoAxesCombined, ChevronLeft, ChevronRight, FileText, HelpCircle, Play, Table2, Upload, X } from "lucide-react";
import { usePageStore } from "../../store/pageStore";
import { useThemeStore } from "../../store/themeStore";

interface TutorialStep {
  title: string;
  description: string;
  icon: typeof Upload;
  tips: string[];
  action?: string;
  page?: "upload" | "assistant";
}

interface InteractiveTourStep {
  title: string;
  description: string;
  target: string;
}

interface TargetRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Add your data",
    description: "Start by bringing a dataset into VisualMind AI.",
    icon: Upload,
    tips: [
      "Upload a CSV or Excel spreadsheet.",
      "Create a dataset manually or generate sample data.",
      "Use the Add dataset button on an empty dashboard to get started.",
    ],
    action: "Open Upload Dataset",
    page: "upload",
  },
  {
    title: "Prepare your dataset",
    description: "Make the table easier to understand before exploring it.",
    icon: Table2,
    tips: [
      "Rename the dataset so it is easy to identify.",
      "Rename columns and drag them into the order you prefer.",
      "Edit cells and manage rows from the dataset table.",
    ],
  },
  {
    title: "Explore the dashboard",
    description: "Choose a chart that makes your data clear.",
    icon: ChartNoAxesCombined,
    tips: [
      "Use the controls below the chart to switch between 2D and 3D.",
      "Bar Chart is the default; choose another chart style whenever you like.",
      "Use the 3D workspace controls to change the 3D graph style and filter records.",
    ],
  },
  {
    title: "Inspect records",
    description: "Interact with chart marks to examine the underlying data.",
    icon: Table2,
    tips: [
      "Hover over chart marks to see details.",
      "Select a bar or mark to view its corresponding record.",
      "Use chart-specific controls and 3D filters to focus on the data you need.",
    ],
  },
  {
    title: "Ask the AI assistant",
    description: "Ask questions about the dataset in natural language.",
    icon: Bot,
    tips: [
      "Open AI Assistant from the sidebar or the Ask AI button.",
      "Ask for summaries, patterns, or explanations about your current data.",
      "Try a focused question that names the columns or groups you want to understand.",
    ],
    action: "Open AI Assistant",
    page: "assistant",
  },
  {
    title: "Review and export",
    description: "Use the analysis pages to share or revisit your work.",
    icon: FileText,
    tips: [
      "Visualizations shows additional breakdowns of your dataset.",
      "Reports summarizes the data and lets you print or download a PDF.",
      "Settings lets you change the theme and manage dataset history.",
    ],
  },
];

const interactiveTourSteps: InteractiveTourStep[] = [
  {
    title: "Your chart",
    description: "Your dataset is visualized here. Hover over marks for details and select one to inspect its record.",
    target: '[data-tour="dashboard-chart"]',
  },
  {
    title: "Chart controls",
    description: "Switch between 2D and 3D, then choose the chart style that best suits your data.",
    target: '[data-tour="chart-controls"]',
  },
  {
    title: "AI insights",
    description: "Review automatically generated findings and recommendations for the active dataset.",
    target: '[data-tour="ai-insights"]',
  },
  {
    title: "Ask AI",
    description: "Open the assistant to ask questions about your data in natural language.",
    target: '[data-tour="ask-ai"]',
  },
];

function TutorialGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);
  const [tourTargetRect, setTourTargetRect] = useState<TargetRect | null>(null);
  const isLightTheme = useThemeStore((state) => state.theme === "light");
  const activePage = usePageStore((state) => state.activePage);
  const setActivePage = usePageStore((state) => state.setActivePage);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen && tourStepIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setTourStepIndex(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, tourStepIndex]);

  useEffect(() => {
    if (tourStepIndex === null || activePage !== "dashboard") return;

    const target = document.querySelector<HTMLElement>(interactiveTourSteps[tourStepIndex].target);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    let frame = 0;
    const updateTargetRect = () => {
      const rect = target.getBoundingClientRect();
      setTourTargetRect({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    const initialTimer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(updateTargetRect);
    }, 300);

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.clearTimeout(initialTimer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [tourStepIndex, activePage]);

  function closeGuide() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function openStepPage(page: "upload" | "assistant") {
    setActivePage(page);
    closeGuide();
  }

  function startInteractiveTour() {
    setActivePage("dashboard");
    setIsOpen(false);
    setTourTargetRect(null);
    setTourStepIndex(0);
  }

  function closeInteractiveTour() {
    setTourStepIndex(null);
    setTourTargetRect(null);
    triggerRef.current?.focus();
  }

  function goToTourStep(index: number) {
    if (index < 0 || index >= interactiveTourSteps.length) {
      closeInteractiveTour();
      return;
    }
    setTourTargetRect(null);
    setTourStepIndex(index);
  }

  const step = tutorialSteps[stepIndex];
  const StepIcon = step.icon;
  const actionPage = step.page;
  const tourStep = tourStepIndex === null ? null : interactiveTourSteps[tourStepIndex];
  const activeTourIndex = tourStepIndex ?? 0;
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const spotlightRect = tourTargetRect
    ? {
        top: Math.max(tourTargetRect.top - 8, 0),
        right: Math.min(tourTargetRect.right + 8, viewportWidth),
        bottom: Math.min(tourTargetRect.bottom + 8, viewportHeight),
        left: Math.max(tourTargetRect.left - 8, 0),
      }
    : null;
  const tourCardLeft = tourTargetRect
    ? Math.min(Math.max(tourTargetRect.left + tourTargetRect.width / 2 - 170, 16), Math.max(viewportWidth - 356, 16))
    : Math.max((viewportWidth - 340) / 2, 16);
  const tourCardTop = tourTargetRect && tourTargetRect.bottom + 300 < viewportHeight
    ? tourTargetRect.bottom + 20
    : tourTargetRect
      ? Math.max(tourTargetRect.top - 280, 84)
      : Math.max((viewportHeight - 220) / 2, 84);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setStepIndex(0);
          setIsOpen(true);
        }}
        aria-label="Open website guide"
        title="How to use VisualMind AI"
        className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:px-3 ${
          isLightTheme
            ? "border-violet-300 text-violet-800 hover:border-violet-500 hover:bg-violet-100"
            : "border-violet-500/40 text-violet-200 hover:border-violet-400 hover:bg-violet-500/15"
        }`}
      >
        <HelpCircle size={18} aria-hidden="true" />
        <span className="hidden xl:inline">Guide</span>
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 pb-6 pt-20 backdrop-blur-sm sm:pt-24"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeGuide();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-description"
            className={`max-h-[calc(100dvh-6rem)] w-full max-w-xl overflow-y-auto rounded-2xl border shadow-2xl ${
              isLightTheme
                ? "border-slate-200 bg-white text-slate-900"
                : "border-slate-700 bg-slate-900 text-white"
            }`}
          >
            <header className={`flex items-start justify-between gap-4 border-b p-5 sm:p-6 ${isLightTheme ? "border-slate-200" : "border-slate-700"}`}>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isLightTheme ? "text-violet-700" : "text-violet-300"}`}>
                  Website guide · {stepIndex + 1} of {tutorialSteps.length}
                </p>
                <h2 id="tutorial-title" className="mt-1 text-xl font-bold sm:text-2xl">How to use VisualMind AI</h2>
              </div>
              <button
                type="button"
                onClick={closeGuide}
                aria-label="Close website guide"
                className={`rounded-lg p-2 transition ${isLightTheme ? "text-slate-600 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"}`}
              >
                <X size={20} />
              </button>
            </header>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex gap-2" aria-label={`Step ${stepIndex + 1} of ${tutorialSteps.length}`}>
                {tutorialSteps.map((tutorialStep, index) => (
                  <div
                    key={tutorialStep.title}
                    className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-violet-600" : isLightTheme ? "bg-slate-200" : "bg-slate-700"}`}
                  />
                ))}
              </div>

              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${isLightTheme ? "bg-violet-100 text-violet-700" : "bg-violet-500/15 text-violet-300"}`}>
                  <StepIcon size={24} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p id="tutorial-description" className={`mt-1 text-sm ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                    {step.description}
                  </p>
                </div>
              </div>

              <ul className={`mt-5 space-y-3 text-sm ${isLightTheme ? "text-slate-700" : "text-slate-200"}`}>
                {step.tips.map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              <footer className={`mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${isLightTheme ? "border-slate-200" : "border-slate-700"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startInteractiveTour}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      isLightTheme
                        ? "border-violet-600 text-violet-800 hover:bg-violet-50"
                        : "border-violet-500 text-violet-300 hover:bg-violet-950/40"
                    }`}
                  >
                    <Play size={15} aria-hidden="true" />
                    Interactive tour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                    disabled={stepIndex === 0}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isLightTheme ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                    Back
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {step.action && actionPage && (
                    <button
                      type="button"
                      onClick={() => openStepPage(actionPage)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        isLightTheme
                          ? "border-violet-600 text-violet-800 hover:bg-violet-50"
                          : "border-violet-500 text-violet-300 hover:bg-violet-950/40"
                      }`}
                    >
                      {step.action}
                    </button>
                  )}
                  {stepIndex < tutorialSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex((current) => Math.min(tutorialSteps.length - 1, current + 1))}
                      className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Next
                      <ChevronRight size={17} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={closeGuide}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Done
                    </button>
                  )}
                </div>
              </footer>
            </div>
          </section>
        </div>,
        document.body,
      )}

      {tourStep && createPortal(
        <div className="pointer-events-none fixed inset-0 z-[10001]" aria-live="polite">
          {spotlightRect ? (
            <>
              <div className="pointer-events-auto fixed left-0 top-0 bg-slate-950/65" style={{ width: viewportWidth, height: spotlightRect.top }} />
              <div className="pointer-events-auto fixed left-0 bg-slate-950/65" style={{ top: spotlightRect.top, width: spotlightRect.left, height: spotlightRect.bottom - spotlightRect.top }} />
              <div className="pointer-events-auto fixed bg-slate-950/65" style={{ top: spotlightRect.top, left: spotlightRect.right, width: viewportWidth - spotlightRect.right, height: spotlightRect.bottom - spotlightRect.top }} />
              <div className="pointer-events-auto fixed left-0 bg-slate-950/65" style={{ top: spotlightRect.bottom, width: viewportWidth, height: viewportHeight - spotlightRect.bottom }} />
              <div
                className="pointer-events-none fixed rounded-xl border-2 border-violet-400 shadow-[0_0_0_2px_rgba(139,92,246,0.35)]"
                style={{
                  top: spotlightRect.top,
                  left: spotlightRect.left,
                  width: spotlightRect.right - spotlightRect.left,
                  height: spotlightRect.bottom - spotlightRect.top,
                }}
              />
            </>
          ) : (
            <div className="pointer-events-auto fixed inset-0 bg-slate-950/65" />
          )}
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="interactive-tour-title"
            className={`pointer-events-auto fixed max-h-[calc(100dvh-6rem)] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border p-5 shadow-2xl ${
              isLightTheme
                ? "border-slate-200 bg-white text-slate-900"
                : "border-slate-700 bg-slate-900 text-white"
            }`}
            style={{ left: tourCardLeft, top: tourCardTop }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isLightTheme ? "text-violet-700" : "text-violet-300"}`}>
                  Interactive tour · {activeTourIndex + 1} of {interactiveTourSteps.length}
                </p>
                <h2 id="interactive-tour-title" className="mt-1 text-lg font-bold">{tourStep.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeInteractiveTour}
                aria-label="End interactive tour"
                className={`rounded-lg p-1.5 transition ${isLightTheme ? "text-slate-600 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"}`}
              >
                <X size={18} />
              </button>
            </div>
            <p className={`mt-3 text-sm leading-6 ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>{tourStep.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToTourStep(activeTourIndex - 1)}
                disabled={activeTourIndex === 0}
                className={`flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isLightTheme ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Back
              </button>
              <button
                type="button"
                onClick={() => goToTourStep(activeTourIndex + 1)}
                className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                {activeTourIndex === interactiveTourSteps.length - 1 ? "Finish" : "Next"}
                {activeTourIndex < interactiveTourSteps.length - 1 && <ChevronRight size={16} aria-hidden="true" />}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

export default TutorialGuide;
