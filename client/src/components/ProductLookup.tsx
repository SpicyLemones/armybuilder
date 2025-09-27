import { useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Search, ExternalLink } from "lucide-react";
import { mockProducts, type Product } from "../data/mockData";

/* ---------- Types & label maps ---------- */

type GameKind = "warhammer40k" | "ageofsigmar" | "killteam" | "both";

type ProductExtended = Product & {
  image_url?: string | null;
  game?: GameKind;
};

const GAME_LABEL: Record<GameKind, string> = {
  warhammer40k: "Warhammer 40,000",
  ageofsigmar: "Age of Sigmar",
  killteam: "Kill Team",
  both: "40k • AoS",
};

const GAME_BADGE_CLASS: Record<GameKind, string> = {
  warhammer40k: "bg-indigo-100 text-indigo-700 border-indigo-200",
  ageofsigmar: "bg-amber-100 text-amber-800 border-amber-200",
  killteam: "bg-orange-100 text-orange-800 border-orange-200",
  both: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/* ---------- Page ---------- */

export function ProductLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaction, setSelectedFaction] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return (mockProducts as ProductExtended[]).filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        (p.faction?.toLowerCase?.() ?? "").includes(term);

      const matchesFaction = selectedFaction === "all" || p.faction === selectedFaction;
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;

      return matchesSearch && matchesFaction && matchesCategory;
    });
  }, [searchTerm, selectedFaction, selectedCategory]);

  const factions = [...new Set(mockProducts.map((p) => p.faction).filter(Boolean))];
  const categories = [...new Set(mockProducts.map((p) => p.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Product Lookup</h2>
        <p className="text-muted-foreground">
          Search for Warhammer units and compare prices across retailers
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search units, factions, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800"
          />
        </div>

        <Select value={selectedFaction} onValueChange={setSelectedFaction}>
  <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
    <SelectValue placeholder="All Factions" />
  </SelectTrigger>
  <SelectContent className="w-[180px] bg-white dark:bg-slate-800">
    <SelectItem
      value="all"
      className="cursor-pointer px-2 py-1 rounded-sm data-[highlighted]:bg-blue-500 data-[highlighted]:text-white transition-all"
    >
      All Factions
    </SelectItem>
    {factions
      .filter(f => f) // ensure no empty values
      .map((f) => (
        <SelectItem
          key={f}
          value={f}
          className="cursor-pointer px-2 py-1 rounded-sm data-[highlighted]:bg-blue-500 data-[highlighted]:text-white transition-all"
        >
          {f}
        </SelectItem>
      ))}
  </SelectContent>
</Select>

<Select value={selectedCategory} onValueChange={setSelectedCategory}>
  <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
    <SelectValue placeholder="All Categories" />
  </SelectTrigger>
  <SelectContent className="w-[180px] bg-white dark:bg-slate-800">
    <SelectItem
      value="all"
      className="cursor-pointer px-2 py-1 rounded-sm data-[highlighted]:bg-blue-500 data-[highlighted]:text-white transition-all"
    >
      All Categories
    </SelectItem>
    {categories
      .filter(c => c)
      .map((c) => (
        <SelectItem
          key={c}
          value={c}
          className="cursor-pointer px-2 py-1 rounded-sm data-[highlighted]:bg-blue-500 data-[highlighted]:text-white transition-all"
        >
          {c}
        </SelectItem>
      ))}
  </SelectContent>
</Select>

      </div>

      {/* Results */}
      <div className="grid gap-4">
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p as ProductExtended} />
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Card ---------- */

function ProductCard({ product }: { product: ProductExtended }) {
  const [showAll, setShowAll] = useState(false);

  const sortedRetailers = [...(product.retailers ?? [])].sort(
    (a, b) => a.price - b.price
  );
  const best = sortedRetailers[0];
  const visible = showAll ? sortedRetailers : sortedRetailers.slice(0, 4);

  // Thumbnail with fallback
  const thumb = product.image_url || "https://images.seeklogo.com/logo-png/43/1/warhammer-logo-png_seeklogo-438364.png";

  return (
    <Card className="overflow-hidden bg-white shadow-md border border-slate-200">
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image */}
          <div className="w-full md:w-40 flex-shrink-0">
            <div className="aspect-square overflow-hidden rounded-md border bg-white">
              <img
                src={thumb}
                alt={product.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* Text meta */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <CardTitle className="font-display text-lg md:text-xl">
                {product.name || "Unnamed Product"}
              </CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">
                  {product.faction || "Unknown Faction"}
                </Badge>
                <span className="text-slate-600">
                  {product.category || "Uncategorized"}
                </span>
                {typeof product.points === "number" && product.points > 0 ? (
                  <span className="text-slate-600">• {product.points} pts</span>
                ) : (
                  <span className="text-slate-400">• Points TBD</span>
                )}
                {product.game ? (
                  <Badge
                    variant="outline"
                    className={`ml-2 border ${GAME_BADGE_CLASS[product.game]}`}
                  >
                    {GAME_LABEL[product.game]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-slate-400">
                    Game TBD
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Best price callout */}
          <div className="text-right md:self-start">
            <div className="text-xs text-slate-500">Best Price</div>
            {best ? (
              <div className="text-2xl font-bold text-green-600 leading-none">
                ${best.price.toFixed(2)}
              </div>
            ) : (
              <div className="text-slate-400">No prices</div>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator className="my-4" />

      {/* Prices */}
      <CardContent className="pt-0">
        <div className="mb-3 font-medium">Available at:</div>

        {visible.length > 0 ? (
          <div className="rounded-md border divide-y">
            {visible.map((r, idx) => (
              <div
                key={`${r.store}-${idx}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2"
              >
                <div className="font-medium">
                  {r.store || "Unknown Store"}
                </div>
                <div className="font-bold tabular-nums">
                  {r.price ? `$${r.price.toFixed(2)}` : "—"}
                </div>
                <div>
                  {r.url ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs text-slate-400">
                      No Link
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400">No retailers yet.</div>
        )}

        {sortedRetailers.length > 4 && (
          <div className="mt-3 text-right">
            <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show Top 4" : `Show all ${sortedRetailers.length} offers`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
