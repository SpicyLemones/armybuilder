import { Link, NavLink } from "react-router-dom";

export function Header() {
  // Small helper to style active tabs
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [
      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <img
            className="h-7 w-7 rounded-md"
            src="/images/armybuilderlogo.png"
            alt="Logo"
          />
          <span>ArmyBuilder</span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink to="/" end className={tabClass}>
            🔎 Product Lookup
          </NavLink>
          <NavLink to="/builder" className={tabClass}>
            🛡️ Army Builder
          </NavLink>
          <NavLink to="/dev" className={tabClass}>
            🐞 Debug
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
