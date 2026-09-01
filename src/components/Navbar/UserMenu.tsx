import { useEffect, useRef, useState } from "react";
import { LogOut, UserCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

function UserMenu() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Account menu"
        className="flex shrink-0 items-center gap-2 rounded-lg p-1 transition hover:bg-slate-700"
      >
        <UserCircle size={30} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
          <p className="truncate text-sm font-medium text-white">{user.name || user.email}</p>

          {user.name && <p className="truncate text-xs text-slate-400">{user.email}</p>}

          {user.region && <p className="mt-2 text-xs text-slate-500">Region: {user.region}</p>}

          {user.lastLoginCountry && (
            <p className="text-xs text-slate-500">
              Last login: {user.lastLoginCountry}
              {user.lastLoginAt && ` · ${new Date(user.lastLoginAt).toLocaleString()}`}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-red-500 hover:text-red-400"
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
