import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
import { Search, ExternalLink, X } from "lucide-react";

// ⬇️ use Data.ts now
import { Products as sourceProducts, type Product } from "../data/Data";

/* ------------------------------------------------
   Types, labels, & helpers
--------------------------------------------------*/

type GameKind = "warhammer40k" | "ageofsigmar" | "killteam" | "both";

type ProductExtended = Product & {
  image?: string | null; // optional url from export (server)
  game?: GameKind;       // allow extra values safely
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

type SortKey =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "points-asc"
  | "points-desc";

const bestPriceOrNull = (p: Product) => {
  const nums =
    p.retailers?.map(r => Number(r?.price)).filter(v => Number.isFinite(v)) ?? [];
  return nums.length ? Math.min(...nums) : null;
};

const hasAnyPrice = (p: Product) => bestPriceOrNull(p) !== null;

const cmpPriceAsc = (a: Product, b: Product) => {
  const A = bestPriceOrNull(a);
  const B = bestPriceOrNull(b);
  if (A === null && B === null) return 0; // both missing → equal
  if (A === null) return 1;               // missing goes to end
  if (B === null) return -1;
  return A - B;                           // normal asc
};

const cmpPriceDesc = (a: Product, b: Product) => {
  const A = bestPriceOrNull(a);
  const B = bestPriceOrNull(b);
  if (A === null && B === null) return 0;
  if (A === null) return 1;               // missing goes to end
  if (B === null) return -1;
  return B - A;                           // normal desc
};

const sample = <T,>(arr: T[], n: number) => {
  if (n >= arr.length) return [...arr];
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
};

/* ------------------------------------------------
   Page
--------------------------------------------------*/

export function ProductLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [selectedFaction, setSelectedFaction] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("featured");

  // stable featured selection for the session
  const featuredIdsRef = useRef<string[] | null>(null);

  // distinct lists for pickers
  const factions = useMemo(
    () => [...new Set(sourceProducts.map((p) => p.faction).filter(Boolean))],
    []
  );
  const categories = useMemo(
    () => [...new Set(sourceProducts.map((p) => p.category).filter(Boolean))],
    []
  );
  const games = ["warhammer40k", "ageofsigmar"] as const;

  const hasQueryOrFilters =
    searchTerm.trim().length > 0 ||
    selectedGame !== "all" ||
    selectedFaction !== "all" ||
    selectedCategory !== "all" ||
    sortBy !== "featured";

  // 1) filter by search/faction/category/game
  const filteredAll = useMemo(() => {
    return (sourceProducts as ProductExtended[]).filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.faction?.toLowerCase?.() ?? "").includes(term);

      const matchesGame = selectedGame === "all" || p.game === selectedGame;
      const matchesFaction = selectedFaction === "all" || p.faction === selectedFaction;
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;

      return matchesSearch && matchesGame && matchesFaction && matchesCategory;
    });
  }, [searchTerm, selectedGame, selectedFaction, selectedCategory]);

  // 2) initial featured (first load only): 5 random with prices
  const initialFeatured = useMemo(() => {
    if (hasQueryOrFilters) return [];
    const withPrices = (sourceProducts as ProductExtended[]).filter(hasAnyPrice);
    const chosen = sample(withPrices, 5);
    featuredIdsRef.current = chosen.map((c) => c.id);
    return chosen;
  }, [hasQueryOrFilters]);

  // 3) working set
  const workingSet: Product[] = hasQueryOrFilters ? filteredAll : initialFeatured;

  // 4) sorting
  const sorted = useMemo(() => {
    const arr = [...workingSet];
    switch (sortBy) {
      case "price-asc":
        arr.sort(cmpPriceAsc);
        break;
      case "price-desc":
        arr.sort(cmpPriceDesc);
        break;
      case "points-asc":
        arr.sort((a, b) => (a.points ?? Infinity) - (b.points ?? Infinity));
        break;
      case "points-desc":
        arr.sort((a, b) => (b.points ?? -Infinity) - (a.points ?? -Infinity));
        break;
      case "featured":
      default:
        if (!hasQueryOrFilters && featuredIdsRef.current) {
          const order = new Map(featuredIdsRef.current.map((id, i) => [id, i]));
          arr.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        }
        break;
    }
    return arr;
  }, [workingSet, sortBy, hasQueryOrFilters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Warhammer Price Lookup</h1>
        <p>Compare prices for Warhammer kits across AU retailers.</p>

        <p className="text-muted-foreground">
          Search for Warhammer units and compare prices across retailers
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {/* search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search units, factions, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800"
          />
        </div>

        {/* game */}
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 ">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent className="w-[180px] bg-white dark:bg-slate-800">
            <SelectItem
              value="all"
              className="cursor-pointer px-2 py-1 rounded-sm data-[highlighted]:bg-blue-500 data-[highlighted]:text-white transition-all"
            >
              All Games
            </SelectItem>
            {games.map((g) => (
              <SelectItem
                key={g}
                value={g}
                className="cursor-pointer px-2 py-1 rounded-sm data-[highlighted]:bg-blue-500 data-[highlighted]:text-white transition-all"
              >
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* faction */}
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
            {factions.map((f) => (
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

        {/* category */}
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
            {categories.map((c) => (
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

        {/* sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[200px] bg-white dark:bg-slate-800">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="w-[200px] bg-white dark:bg-slate-800">
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price (low → high)</SelectItem>
            <SelectItem value="price-desc">Price (high → low)</SelectItem>
            <SelectItem value="points-asc">Points (low → high)</SelectItem>
            <SelectItem value="points-desc">Points (high → low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {sorted.map((p) => (
          <ProductCard key={p.id} product={p as ProductExtended} />
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------
   Card (with zoom modal & top-3 offers)
--------------------------------------------------*/

function ProductCard({ product }: { product: ProductExtended }) {
  const [showAll, setShowAll] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const sortedRetailers = [...(product.retailers ?? [])].sort(
    (a, b) => a.price - b.price
  );
  const best = sortedRetailers[0];
  const visible = showAll ? sortedRetailers : sortedRetailers.slice(0, 3); // top 3

  // thumbnail (fallback)
  const thumb =
    product.image ||
    "./images/placeholder.png";

  return (
    <>
      <Card className="overflow-hidden bg-white shadow-md border border-slate-200">
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Image (click to zoom) */}
            <div className="w-full md:w-40 flex-shrink-0">
              <div
                className="aspect-square overflow-hidden rounded-md border bg-white cursor-pointer"
                onClick={() => setZoomed(true)}
                aria-label="Open image preview"
              >
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
                      className={`ml-2 border ${GAME_BADGE_CLASS[product.game] ?? ""}`}
                    >
                      {GAME_LABEL[product.game] ?? product.game}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-slate-400">
                      Game TBD
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Best price */}
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
                  <div className="font-medium">{r.store || "Unknown Store"}</div>
                  <div className="font-bold tabular-nums">
                    {Number.isFinite(r.price) ? `$${r.price.toFixed(2)}` : "—"}
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

          {sortedRetailers.length > 3 && (
            <div className="mt-3 text-right">
              <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                {showAll ? "Show Top 3" : `Show all ${sortedRetailers.length} offers`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zoom Modal via portal (always center viewport) */}
      {zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
            onClick={() => setZoomed(false)}
          >
            <div
              className="relative bg-white rounded-lg shadow-lg p-4 flex items-center justify-center max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomed(false)}
                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-slate-100"
                aria-label="Close image preview"
              >
                <X className="h-5 w-5 text-slate-700" />
              </button>
              <img
                src={thumb}
                alt={product.name}
                className="max-h-[85vh] max-w-[85vw] object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
