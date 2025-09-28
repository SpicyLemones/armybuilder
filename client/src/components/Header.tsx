import { Link, NavLink } from "react-router-dom";

export function Header() {
  // Shared tab style that highlights the active route
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [
      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <img
            className="h-7 w-7 rounded-md"
            src="/images/armybuilderlogo.png"
            alt="Logo"
          />
          <span>PriceHammer</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
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
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            // onClick={() => setRegionOpen(true)} // (hook up later if you add a region picker)
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
