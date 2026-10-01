import { useState } from "react";
import { Loader2, Moon, Sun } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDatasetStore } from "../store/datasetStore";
import { useSidebarStore } from "../store/sidebarStore";
import { useThemeStore } from "../store/themeStore";

function Settings() {
  const { fileName, analysis, history, clearDataset, clearHistory } = useDatasetStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const { theme, setTheme } = useThemeStore();
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword) {
      setDeleteError("Enter your current password to continue.");
      return;
    }

    if (confirmation !== "DELETE") {
      setDeleteError("Type DELETE exactly to confirm account removal.");
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteAccount(currentPassword, confirmation);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete your account.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto glass-scrollbar flex flex-col gap-4 lg:gap-5">
      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h2 className="text-xl font-semibold">Settings</h2>

        <p className="text-sm text-slate-400">Manage your dataset and app preferences.</p>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-1">Dataset</h3>

        <p className="text-sm text-slate-400 mb-4">
          {fileName ? `${fileName} • ${analysis?.rowCount.toLocaleString()} rows` : "No dataset uploaded."}
        </p>

        <button
          onClick={clearDataset}
          disabled={!fileName}
          className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear Dataset
        </button>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-1">Dataset History</h3>

        <p className="text-sm text-slate-400 mb-4">
          {history.length > 0 ? `${history.length} previous dataset${history.length === 1 ? "" : "s"} saved.` : "No previous datasets saved."}
        </p>

        <button
          onClick={clearHistory}
          disabled={history.length === 0}
          className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear History
        </button>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "dark" ? "Dark theme" : "Light theme"}
            </p>

            <p className="text-xs text-slate-500">Choose the appearance used across the app.</p>
          </div>

          <button
            type="button"
            role="switch"
            aria-label="Light theme"
            aria-checked={theme === "light"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${theme === "light" ? "bg-violet-600" : "bg-slate-700"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${theme === "light" ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <div className="mt-6 hidden items-center justify-between gap-4 border-t border-slate-700 pt-4 lg:flex">
          <div>
            <p className="text-sm font-medium">Collapse sidebar by default</p>
            <p className="text-xs text-slate-500">Show the icon-only sidebar on desktop.</p>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-pressed={isCollapsed}
            aria-label="Collapse sidebar by default"
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${isCollapsed ? "bg-violet-600" : "bg-slate-700"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${isCollapsed ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </div>

      <div className="delete-account-panel shrink-0 rounded-2xl border border-red-500/40 bg-red-950/20 p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-red-300">Delete Account</h3>
        <p className="mt-1 text-sm text-slate-400">Permanently delete your account, datasets, and chat history. This cannot be undone.</p>

        <form onSubmit={handleDeleteAccount} className="mt-4 flex max-w-xl flex-col gap-3">
          <div>
            <label htmlFor="delete-account-password" className="text-sm font-medium text-slate-300">
              Current password
            </label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={isDeleting}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label htmlFor="delete-account-confirmation" className="text-sm font-medium text-slate-300">
              Type DELETE to confirm
            </label>
            <input
              id="delete-account-confirmation"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isDeleting}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </div>

          {deleteError && (
            <p role="alert" className="text-sm text-red-400">
              {deleteError}
            </p>
          )}

          <button
            type="submit"
            disabled={isDeleting}
            className="flex w-fit items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting && <Loader2 size={15} className="animate-spin" />}
            {isDeleting ? "Deleting account..." : "Delete my account"}
          </button>
          {!deleteError && (
            <p className="text-xs text-slate-500">Enter your password and type DELETE exactly; the button will report any missing confirmation.</p>
          )}
        </form>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0">
        <h3 className="text-lg font-semibold mb-3">About</h3>

        <div className="text-sm text-slate-400 space-y-1">
          <p>VisualMind AI</p>

          <p>AI analysis powered by Groq.</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
