import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  House, CalendarBlank, Users, Package, Receipt, ChartLineUp, FileText, ChartBar, SignOut,
} from "@phosphor-icons/react";

const items = [
  { to: "/", label: "Dashboard", icon: House, end: true, tid: "nav-dashboard" },
  { to: "/calendario", label: "Calendario", icon: CalendarBlank, tid: "nav-calendar" },
  { to: "/ospiti", label: "Ospiti", icon: Users, tid: "nav-guests" },
  { to: "/magazzino", label: "Magazzino", icon: Package, tid: "nav-inventory" },
  { to: "/scadenziario", label: "Scadenziario", icon: Receipt, tid: "nav-expenses" },
  { to: "/prezzi", label: "Prezzi Dinamici", icon: ChartLineUp, tid: "nav-pricing" },
  { to: "/alloggiati", label: "Alloggiati Web", icon: FileText, tid: "nav-alloggiati" },
  { to: "/ross1000", label: "ROSS 1000 ISTAT", icon: ChartBar, tid: "nav-ross1000" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => { await logout(); nav("/login"); };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0" data-testid="sidebar">
        <div className="p-6 border-b border-border">
          <div className="overline">Villa · Gestionale</div>
          <div className="font-serif text-3xl mt-1 leading-none">Casa<span className="text-accent">.</span></div>
          <div className="text-xs text-muted-foreground mt-2">Bed &amp; Breakfast Suite</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              data-testid={it.tid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <it.icon size={18} weight="duotone" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="mt-3 w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <SignOut size={16} /> Esci
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
