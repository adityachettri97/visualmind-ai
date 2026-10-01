import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import { useAuthStore } from "./store/authStore";

function App() {
  const { status, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050816] px-6 text-white" role="status" aria-live="polite">
        <Loader2 className="animate-spin text-violet-500" size={32} />
        <div className="text-center">
          <p className="font-medium">Connecting to your account...</p>
          <p className="mt-1 text-sm text-slate-400">The server may take a moment to wake up.</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Auth />;
  }

  return <Dashboard />;
}

export default App;
