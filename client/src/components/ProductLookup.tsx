import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, ExternalLink } from 'lucide-react';
import { mockProducts, type Product } from '../data/mockData';

export function ProductLookup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.faction.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFaction = selectedFaction === 'all' || product.faction === selectedFaction;
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesFaction && matchesCategory;
    });
  }, [searchTerm, selectedFaction, selectedCategory]);

  const factions = [...new Set(mockProducts.map(p => p.faction))];
  const categories = [...new Set(mockProducts.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Product Lookup</h2>
        <p className="text-muted-foreground">
          Search for Warhammer 40k units and compare prices across retailers
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
            className="pl-10"
          />
        </div>
        <Select value={selectedFaction} onValueChange={setSelectedFaction}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Factions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Factions</SelectItem>
            {factions.map(faction => (
              <SelectItem key={faction} value={faction}>{faction}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
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

function ProductCard({ product }: { product: Product }) {
  const lowestPrice = Math.min(...product.retailers.map(r => r.price));
  const highestPrice = Math.max(...product.retailers.map(r => r.price));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {product.name}
              <Badge variant="outline">{product.faction}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {product.category} • {product.points} pts
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Best Price</div>
            <div className="text-2xl font-bold text-green-600">
              ${lowestPrice.toFixed(2)}
            </div>
            {lowestPrice !== highestPrice && (
              <div className="text-sm text-muted-foreground line-through">
                ${highestPrice.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="font-medium">Available at:</h4>
          <div className="grid gap-2">
            {product.retailers
              .sort((a, b) => a.price - b.price)
              .map((retailer, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{retailer.store}</span>
                  {retailer.inStock && (
                    <Badge variant="secondary" className="text-xs">In Stock</Badge>
                  )}
                  {!retailer.inStock && (
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">${retailer.price.toFixed(2)}</span>
                  <Button size="sm" variant="outline" asChild>
                    <a href={retailer.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}