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
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <Loader2 className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Auth />;
  }

  return <Dashboard />;
}

export default App;
