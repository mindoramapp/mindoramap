// Top header: logo, the page's own content and one account menu (plans, theme, admin, sign out),
// so page content (e.g. the editor toolbar) keeps the room it needs.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/store/auth";
import { useUsageTracker } from "@/hooks/useUsageTracker";
import { useTheme } from "@/hooks/useTheme";
import { LogOut, Brain, Crown, Download, FolderOpen, Home, Moon, Shield, Sun } from "lucide-react";
import { useInstallPrompt } from "@/features/pwa/installPrompt";

const MENU_ITEM =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-muted";

export function Header({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useUsageTracker(Boolean(user && (user.role === "superadmin" || user.accessGranted)));

  const signOut = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="relative z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-1 border-b border-border bg-card px-2 pt-[env(safe-area-inset-top)] sm:gap-3 sm:px-4">
      <Link
        to="/dashboard"
        className="flex shrink-0 items-center gap-2 font-semibold pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        aria-label="Mindora — meus mapas"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-hero)] text-primary-foreground">
          <Brain size={18} />
        </span>
        <span className={children ? "hidden lg:inline" : "hidden sm:inline"}>Mindora</span>
      </Link>
      <div className="mx-1 flex min-w-0 flex-1 items-center gap-1 sm:mx-2 sm:gap-2 lg:mx-4">
        {children}
      </div>

      {/* Account, plans, theme and admin live in one menu, so the bar stays for the page. */}
      <div className="shrink-0">
        <AccountMenu
          name={user?.name}
          isAdmin={user?.role === "superadmin"}
          onSignOut={user ? signOut : undefined}
        />
      </div>
    </header>
  );
}

function AccountMenu({
  name,
  isAdmin,
  onSignOut,
}: {
  name?: string;
  isAdmin: boolean;
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const installMode = useInstallPrompt((state) => (state.installed ? null : state.mode));

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as globalThis.Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted"
        aria-label="Menu da conta"
        title="Conta, planos e tema"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-sm font-semibold">
          {(name?.trim()[0] ?? "?").toUpperCase()}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          {name && <p className="truncate px-3 py-2 text-xs text-muted-foreground">{name}</p>}
          {onSignOut && (
            <Link
              to="/dashboard"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => setOpen(false)}
            >
              <FolderOpen size={16} /> Meus mapas
            </Link>
          )}
          {onSignOut && (
            <Link to="/plans" role="menuitem" className={MENU_ITEM} onClick={() => setOpen(false)}>
              <Crown size={16} /> Planos
            </Link>
          )}
          <button type="button" role="menuitem" className={MENU_ITEM} onClick={toggle}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Tema claro" : "Tema escuro"}
          </button>
          {installMode && (
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event("mindora:install-invite"));
              }}
            >
              <Download size={16} /> Instalar app
            </button>
          )}
          <Link to="/" role="menuitem" className={MENU_ITEM} onClick={() => setOpen(false)}>
            <Home size={16} /> Página inicial
          </Link>
          {isAdmin && (
            <Link to="/admin" role="menuitem" className={MENU_ITEM} onClick={() => setOpen(false)}>
              <Shield size={16} /> Painel admin
            </Link>
          )}
          {onSignOut && (
            <button
              type="button"
              role="menuitem"
              className={`${MENU_ITEM} text-destructive`}
              onClick={onSignOut}
            >
              <LogOut size={16} /> Sair
            </button>
          )}
        </div>
      )}
    </div>
  );
}
