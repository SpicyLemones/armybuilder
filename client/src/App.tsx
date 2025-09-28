import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { ProductLookup } from "@/components/ProductLookup";
import { ArmyBuilder } from "@/components/ArmyBuilder";
import { About } from "@/components/About";
import { ContactStatic } from "@/components/ContactStatic";
import { NotFound } from "@/components/NotFound";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Footer } from "@/components/Footer";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gaPageview } from "@/lib/ga";

function RouteTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    gaPageview(pathname + (search || ""));
  }, [pathname, search]);
  return null;
}

// In your App component JSX, just render <RouteTracker /> once (e.g., above <Routes/>)


function DebugPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Dev / Debug</h2>
      <p className="text-slate-600 text-sm">Add any tools you want here.</p>
    </div>
  );
}

export default function App() {
  return (
    // Make the whole app a column so footer sits at bottom
    <div className="min-h-screen bg-fixed bg-cover bg-center app-bg">
      <div className="min-h-screen bg-white/60 dark:bg-black/70 backdrop-blur-sm flex flex-col">
        <Header />
        <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <AppErrorBoundary>
            <RouteTracker/>
            <Routes>
              <Route path="/" element={<ProductLookup />} />
              <Route path="/builder" element={<ArmyBuilder />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<ContactStatic />} />
              {/* stub pages you can fill later */}
              <Route path="/privacy" element={<div className="max-w-2xl mx-auto">Privacy policy TBD.</div>} />
              <Route path="/terms" element={<div className="max-w-2xl mx-auto">Terms of use TBD.</div>} />
              <Route path="/dev" element={<DebugPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
  );
}
