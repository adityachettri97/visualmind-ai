import { LayoutDashboard, Box, FolderOpen, ChartColumn, Bot, FileBarChart, Settings, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { slideLeft } from "../../animations";
import { useSidebarStore } from "../../store/sidebarStore";
import { useDatasetStore } from "../../store/datasetStore";
import { usePageStore, type Page } from "../../store/pageStore";
import { useRef, useState } from "react";
import Tooltip from "../Common/tooltip";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useArrowKeyNav } from "../../hooks/useArrowKeyNav";

const menuItems: { title: string; icon: typeof LayoutDashboard; page: Page }[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    page: "dashboard",
  },
  {
    title: "3D Workspace",
    icon: Box,
    page: "workspace",
  },
  {
    title: "Upload Dataset",
    icon: FolderOpen,
    page: "upload",
  },
  {
    title: "Visualizations",
    icon: ChartColumn,
    page: "visualizations",
  },
  {
    title: "AI Assistant",
    icon: Bot,
    page: "assistant",
  },
  {
    title: "Reports",
    icon: FileBarChart,
    page: "reports",
  },
  {
    title: "Settings",
    icon: Settings,
    page: "settings",
  },
];

function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebarStore();
  const { fileName, analysis } = useDatasetStore();
  const { activePage, setActivePage } = usePageStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<{ top: number; right: number; height: number } | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navRef = useRef<HTMLElement>(null);

  useArrowKeyNav(navRef, { orientation: "vertical" });

  // Below lg, the sidebar is a full-width overlay drawer, never the icon-only rail.
  const collapsed = isDesktop && isCollapsed;

  const handleNavigate = (page: Page) => {
    setActivePage(page);

    if (!isDesktop) closeMobileSidebar();
  };

  return (
    <>
      {/* Mobile/tablet backdrop */}
      <AnimatePresence>
        {!isDesktop && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 z-[9998] bg-black/60 lg:hidden print:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={slideLeft}
        initial="hidden"
        animate={isDesktop ? { width: isCollapsed ? 96 : 256, x: 0, opacity: 1 } : { width: 288, x: isMobileOpen ? 0 : "-110%", opacity: 1 }}
        transition={{
          duration: 0.3,
        }}
        style={{ borderRadius: isDesktop ? undefined : 0 }}
        className="glass glass-scrollbar fixed inset-y-0 left-0 my-0 ml-0 flex flex-col justify-between overflow-y-auto overflow-x-hidden z-[9999] lg:static lg:inset-auto lg:my-4 lg:ml-4 print:hidden"
      >
        {/* Navigation */}
        <div className="p-5">
          {!collapsed && <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-6">Dashboard</h2>}

          <nav ref={navRef} className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="relative"
                  onMouseEnter={(event) => {
                    setHoveredItem(item.title);
                    const rect = event.currentTarget.getBoundingClientRect();
                    setHoveredRect({ top: rect.top, right: rect.right, height: rect.height });
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <motion.button
                    onClick={() => handleNavigate(item.page)}
                    whileHover={{
                      scale: 1.02,
                      x: 6,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    className={`
group
w-full
flex
items-center
rounded-xl
transition-all
duration-300

${activePage === item.page ? "bg-violet-600/20 border border-violet-500/30 text-violet-300" : "hover:bg-violet-500/15 hover:text-violet-300"}
${collapsed ? "justify-center py-4 px-0" : "gap-3 px-4 py-3"}
`}
                  >
                    <motion.div
                      animate={{
                        scale: collapsed ? 1.15 : 1,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                    >
                      <Icon size={collapsed ? 30 : 22} className="text-slate-300 group-hover:text-violet-300 transition-all duration-300" />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <Tooltip show={collapsed && hoveredItem === item.title} text={item.title} anchor={hoveredRect} />
                </div>
              );
            })}
          </nav>
        </div>

        {/* Dataset Card */}
        {!collapsed && (
          <div className="p-5">
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.6,
              }}
              className="glass glass-hover rounded-xl bg-[#131C31] p-4 border border-slate-700"
            >
              <div className="flex items-center gap-2 mb-3">
                <Database className="text-violet-400" size={18} />

                <h3 className="font-semibold">Current Dataset</h3>
              </div>

              <p className="truncate text-sm text-slate-300" title={fileName || undefined}>
                {fileName || "No dataset uploaded"}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {analysis ? `${analysis.rowCount.toLocaleString()} Rows • ${analysis.columnCount} Columns` : "No dataset available"}
              </p>
              <button onClick={() => handleNavigate("upload")} className="mt-4 w-full rounded-lg bg-violet-600 py-2 transition hover:bg-violet-700">
                Change Dataset
              </button>
            </motion.div>
          </div>
        )}
      </motion.aside>
    </>
  );
}

export default Sidebar;
