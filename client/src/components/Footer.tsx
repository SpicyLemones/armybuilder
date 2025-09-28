import { APP_NAME, APP_VERSION, BUILD_TIME } from "@/version";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-12 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: brand + build */}
          <div className="space-x-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{APP_NAME}</span>
            <span className="text-slate-400">v{APP_VERSION}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Build {BUILD_TIME}</span>
          </div>

          {/* Middle: nav */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="hover:underline" to="/about">About</Link>
            <Link className="hover:underline" to="/contact">Contact</Link>
            <Link className="hover:underline" to="/privacy">Privacy</Link>
            <Link className="hover:underline" to="/terms">Terms</Link>
          </nav>

          {/* Right: contact email */}
          <div>
            <a
              className="hover:underline"
              href="mailto:pricehammer25@gmail.com?subject=PriceHammer%20Feedback%20/%20Bug"
            >
              pricehammer25@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
