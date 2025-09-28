import { Link, NavLink } from "react-router-dom";

export function Header() {
  // Shared tab style that highlights the active route
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [
      "px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <img
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-md"
            src="/images/armybuilderlogo.png"
            alt="Logo"
          />
          <span className="text-base sm:text-lg">PriceHammer</span>
        </Link>

        {/* Nav (scrolls horizontally on mobile if needed) */}
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-2 px-2">
          <NavLink to="/" end className={tabClass}>
            🔎 Product Lookup
          </NavLink>

          <NavLink to="/about" className={tabClass}>
            About
          </NavLink>

          <NavLink to="/contact" className={tabClass}>
            Contact
          </NavLink>

          {/* Region “button”—kept as non-route but styled like the tabs */}
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap"
            aria-label="Change region"
            title="Change region (WIP)"
          >
            Change Region: <span className="ml-1 align-middle">🇦🇺 (WIP)</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
