import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { ProductLookup } from "@/components/ProductLookup";
import { ArmyBuilder } from "@/components/ArmyBuilder";

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
    // Outer wrapper holds your background image
    <div className="min-h-screen bg-fixed bg-cover bg-center app-bg">
      {/* Overlay for readability */}
      <div className="min-h-screen bg-white/60 dark:bg-black/70 backdrop-blur-sm">
        <Header />
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<ProductLookup />} />
            <Route path="/builder" element={<ArmyBuilder />} />
            <Route path="/dev" element={<DebugPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
