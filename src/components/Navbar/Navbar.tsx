import { Brain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInDown } from "../../animations";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebarStore } from "../../store/sidebarStore";
import { usePageStore } from "../../store/pageStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import DatasetSearch from "./DatasetSearch";
import UserMenu from "./UserMenu";

function Navbar() {
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useSidebarStore();
  const { setActivePage } = usePageStore();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleToggle = () => (isDesktop ? toggleSidebar() : toggleMobileSidebar());
  const isPanelOpen = isDesktop ? !isCollapsed : isMobileOpen;

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      className="glass relative z-40 h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 print:hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button onClick={handleToggle} className="shrink-0 rounded-lg p-2 hover:bg-slate-700 transition">
          {isPanelOpen ? <PanelLeftClose size={22} /> : <PanelLeftOpen size={22} />}
        </button>

        <Brain className="shrink-0 text-violet-500" size={28} />

        {(!isDesktop || !isCollapsed) && (
          <div className="hidden sm:block min-w-0">
            <h1 className="text-lg font-bold truncate">VisualMind AI</h1>

            <p className="text-xs text-slate-400">Intelligent Analytics</p>
          </div>
        )}
      </div>

      <DatasetSearch />

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-5">
        <motion.button
          onClick={() => setActivePage("assistant")}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 25px rgba(124,58,237,.55)",
          }}
          whileTap={{
            scale: 0.95,
          }}
          transition={{
            duration: 0.2,
          }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-3 sm:px-4 py-2 rounded-lg"
        >
          <Sparkles size={18} />
          <span className="hidden sm:inline">Ask AI</span>
        </motion.button>
        <p className="hidden lg:block text-sm text-slate-400 whitespace-nowrap">
          Powered by <span className="text-white font-semibold">Groq</span>
        </p>

        <UserMenu />
      </div>
    </motion.header>
  );
}

export default Navbar;
