import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Minus, Trash2, ArrowLeft, Edit } from 'lucide-react';
import { mockProducts, gameCategories, type Product } from '../data/mockData';

interface ArmyUnit {
  product: Product;
  quantity: number;
  selectedRetailer: number;
}

type BuilderStep = 'game' | 'faction' | 'category' | 'units';

export function ArmyBuilder() {
  const [step, setStep] = useState<BuilderStep>('game');
  const [selectedGame, setSelectedGame] = useState<'warhammer40k' | 'ageofsigmar' | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [army, setArmy] = useState<ArmyUnit[]>([]);

  // Get available factions for selected game
  const availableFactions = useMemo(() => {
    if (!selectedGame) return [];
    return [...new Set(mockProducts
      .filter(p => p.game === selectedGame)
      .map(p => p.faction)
    )];
  }, [selectedGame]);

  // Get available categories for selected game
  const availableCategories = useMemo(() => {
    if (!selectedGame) return [];
    return gameCategories[selectedGame];
  }, [selectedGame]);

  // Get filtered products for current selection
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => 
      product.game === selectedGame && 
      product.faction === selectedFaction &&
      product.category === selectedCategory
    );
  }, [selectedGame, selectedFaction, selectedCategory]);

  // Group army units by category
  const armyByCategory = useMemo(() => {
    const grouped: Record<string, ArmyUnit[]> = {};
    army.forEach(unit => {
      const category = unit.product.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(unit);
    });
    return grouped;
  }, [army]);

  // Calculate army statistics by category
  const armyStatsByCategory = useMemo(() => {
    const stats: Record<string, { points: number; cost: number; models: number }> = {};
    let totalPoints = 0;
    let totalCost = 0;
    let totalModels = 0;

    Object.entries(armyByCategory).forEach(([category, units]) => {
      const categoryPoints = units.reduce((sum, unit) => sum + (unit.product.points * unit.quantity), 0);
      const categoryCost = units.reduce((sum, unit) => {
        const retailerPrice = unit.product.retailers[unit.selectedRetailer].price;
        return sum + (retailerPrice * unit.quantity);
      }, 0);
      const categoryModels = units.reduce((sum, unit) => sum + unit.quantity, 0);

      stats[category] = {
        points: categoryPoints,
        cost: categoryCost,
        models: categoryModels
      };

      totalPoints += categoryPoints;
      totalCost += categoryCost;
      totalModels += categoryModels;
    });

    return { byCategory: stats, total: { points: totalPoints, cost: totalCost, models: totalModels } };
  }, [armyByCategory]);

  const addToArmy = (product: Product, retailerIndex: number) => {
    const existingUnit = army.find(unit => unit.product.id === product.id);
    
    if (existingUnit) {
      setArmy(army.map(unit => 
        unit.product.id === product.id 
          ? { ...unit, quantity: unit.quantity + 1 }
          : unit
      ));
    } else {
      setArmy([...army, { 
        product, 
        quantity: 1, 
        selectedRetailer: retailerIndex 
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setArmy(army.filter(unit => unit.product.id !== productId));
    } else {
      setArmy(army.map(unit => 
        unit.product.id === productId 
          ? { ...unit, quantity: newQuantity }
          : unit
      ));
    }
  };

  const updateRetailer = (productId: string, retailerIndex: number) => {
    setArmy(army.map(unit => 
      unit.product.id === productId 
        ? { ...unit, selectedRetailer: retailerIndex }
        : unit
    ));
  };

  const removeFromArmy = (productId: string) => {
    setArmy(army.filter(unit => unit.product.id !== productId));
  };

  const clearArmy = () => {
    setArmy([]);
  };

  const goBack = () => {
    if (step === 'units') {
      setStep('category');
      setSelectedCategory(null);
    } else if (step === 'category') {
      return;
    } else if (step === 'faction') {
      setStep('game');
      setSelectedGame(null);
    }
  };

  const resetBuilder = () => {
    setStep('game');
    setSelectedGame(null);
    setSelectedFaction(null);
    setSelectedCategory(null);
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setStep('units');
  };

  // Show army builder once faction is selected
  const showArmyBuilder = selectedGame && selectedFaction && step !== 'game' && step !== 'faction';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Army Builder</h2>
          <p className="text-muted-foreground">
            {step === 'game' && 'Choose your game system'}
            {step === 'faction' && 'Select your faction (this will be locked once chosen)'}
            {showArmyBuilder && 'Build your army by selecting units from each category'}
          </p>
        </div>
        {step !== 'game' && (
          <div className="flex gap-2">
            {(step === 'units' || step === 'faction') && (
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button variant="outline" onClick={resetBuilder}>
              Start Over
            </Button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      {step !== 'game' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="capitalize text-muted-foreground">{selectedGame?.replace('warhammer40k', 'Warhammer 40k').replace('ageofsigmar', 'Age of Sigmar')}</span>
          {selectedFaction && (
            <>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedFaction}</span>
                {step !== 'faction' && (
                  <Badge variant="secondary" className="text-xs">Locked</Badge>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Game Selection */}
      {step === 'game' && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedGame('warhammer40k');
              setStep('faction');
            }}
          >
            <CardHeader>
              <CardTitle>Warhammer 40,000</CardTitle>
              <p className="text-muted-foreground">
                The grim darkness of the far future where there is only war
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {gameCategories.warhammer40k.map(category => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedGame('ageofsigmar');
              setStep('faction');
            }}
          >
            <CardHeader>
              <CardTitle>Age of Sigmar</CardTitle>
              <p className="text-muted-foreground">
                Epic fantasy battles in the Mortal Realms
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {gameCategories.ageofsigmar.map(category => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Faction Selection */}
      {step === 'faction' && selectedGame && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
          {availableFactions.map(faction => (
            <Card 
              key={faction}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedFaction(faction);
                setStep('category');
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{faction}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {mockProducts.filter(p => p.game === selectedGame && p.faction === faction).length} units available
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Army Builder - PCPartPicker Style */}
      {showArmyBuilder && (
        <div className="space-y-6">
          {/* Army Summary - Compact */}
          {army.length > 0 && (
            <div className="bg-muted/30 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Army Summary</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {armyStatsByCategory.total.models} models • {armyStatsByCategory.total.points} pts
                  </span>
                  <span className="font-bold text-green-600">
                    ${armyStatsByCategory.total.cost.toFixed(2)}
                  </span>
                  <Button variant="outline" size="sm" onClick={clearArmy}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              {/* Category Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(armyStatsByCategory.byCategory).map(([category, stats]) => (
                  <div key={category} className="text-center">
                    <div className="text-xs text-muted-foreground">{category}</div>
                    <div className="font-medium">{stats.points} pts</div>
                    <div className="text-sm text-green-600">${stats.cost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Sections */}
          {availableCategories.map(category => {
            const categoryUnits = armyByCategory[category] || [];
            const hasUnits = categoryUnits.length > 0;
            const availableProducts = mockProducts.filter(p => 
              p.game === selectedGame && 
              p.faction === selectedFaction && 
              p.category === category
            );

            return (
              <div key={category} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{category}</h3>
                    {hasUnits && (
                      <Badge variant="secondary">
                        {categoryUnits.length} unit{categoryUnits.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={selectedCategory === category && step === 'units' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectCategory(category)}
                    disabled={availableProducts.length === 0}
                  >
                    {hasUnits ? <Edit className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    {hasUnits ? 'Edit' : 'Add'} {category}
                  </Button>
                </div>

                {/* Selected Units Table */}
                {hasUnits && (
                  <div className="bg-card border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead className="w-20">Qty</TableHead>
                          <TableHead>Retailer</TableHead>
                          <TableHead className="w-24 text-right">Points</TableHead>
                          <TableHead className="w-24 text-right">Price</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryUnits.map(unit => (
                          <TableRow key={unit.product.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{unit.product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {unit.product.points} pts each
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(unit.product.id, unit.quantity - 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{unit.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(unit.product.id, unit.quantity + 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={unit.selectedRetailer.toString()} 
                                onValueChange={(value) => updateRetailer(unit.product.id, parseInt(value))}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {unit.product.retailers
                                    .map((retailer, index) => ({ ...retailer, originalIndex: index }))
                                    .sort((a, b) => a.price - b.price)
                                    .map((retailer) => (
                                    <SelectItem key={retailer.originalIndex} value={retailer.originalIndex.toString()}>
                                      {retailer.store} - ${retailer.price.toFixed(2)}
                                      {!retailer.inStock && " (Out of Stock)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {unit.quantity * unit.product.points}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${(unit.quantity * unit.product.retailers[unit.selectedRetailer].price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromArmy(unit.product.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* No units message */}
                {!hasUnits && (
                  <div className="bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-2">No {category.toLowerCase()} selected</p>
                    <Button
                      variant="outline"
                      onClick={() => selectCategory(category)}
                      disabled={availableProducts.length === 0}
                    >
                      {availableProducts.length > 0 ? `Choose ${category}` : `No ${category} available`}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unit Selection Modal/Section */}
          {selectedCategory && step === 'units' && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8">
              <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="text-xl font-semibold">Choose {selectedCategory}</h3>
                    <p className="text-sm text-muted-foreground">
                      {filteredProducts.length} units available
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('category');
                      setSelectedCategory(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
                
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                      {filteredProducts.map(product => (
                        <UnitCard 
                          key={product.id} 
                          product={product} 
                          onAddToArmy={addToArmy}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No units available in this category yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UnitCard({ product, onAddToArmy }: { 
  product: Product; 
  onAddToArmy: (product: Product, retailerIndex: number) => void;
}) {
  const [showRetailers, setShowRetailers] = useState(false);
  const sortedRetailers = product.retailers
    .map((retailer, index) => ({ ...retailer, originalIndex: index }))
    .sort((a, b) => a.price - b.price);

  const lowestPrice = sortedRetailers[0].price;

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
            <p className="text-sm font-medium text-green-600 mt-1">
              From ${lowestPrice.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRetailers(!showRetailers)}
            >
              {showRetailers ? 'Hide' : 'Show'} Prices
            </Button>
            <Button 
              onClick={() => onAddToArmy(product, sortedRetailers[0].originalIndex)} 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Best Price
            </Button>
          </div>
        </div>
      </CardHeader>
      {showRetailers && (
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium">Choose retailer:</h4>
            <div className="grid gap-2">
              {sortedRetailers.map((retailer) => (
                <div key={retailer.originalIndex} className="flex justify-between items-center p-2 bg-muted rounded-lg">
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAddToArmy(product, retailer.originalIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}