import { CategoryScore, getRiskColor } from '@/utils/riskCalculator';
import { getRiskColorValue } from '@/utils/riskColors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryCardProps {
  category: CategoryScore;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const colorClass = getRiskColor(category.score);
  const colorValue = getRiskColorValue(category.score);

  return (
    <Card className="glass-card hover:shadow-lg transition-smooth">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <div className="text-2xl font-bold" style={{ color: colorValue }}>
            {Math.round(category.score)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${category.score}%`,
              backgroundColor: colorValue
            }}
          />
        </div>
        
        <div className="space-y-3">
          {category.indicators.map((indicator) => (
            <div key={indicator.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{indicator.name}</span>
              <span className="font-medium">
                {indicator.value.toFixed(1)}{indicator.unit}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Weight in total score</span>
            <span>{(category.weight * 100).toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
