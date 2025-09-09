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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<ProductLookup />} />     {/* default tab */}
          <Route path="/builder" element={<ArmyBuilder />} /> {/* separate page */}
          <Route path="/dev" element={<DebugPage />} />
        </Routes>
      </main>
    </div>
  );
}
