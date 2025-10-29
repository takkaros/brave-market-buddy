import Navigation from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CSVImport from '@/components/CSVImport';
import FIRECalculator from '@/components/FIRECalculator';
import TaxCalculator from '@/components/TaxCalculator';
import DCACalculator from '@/components/DCACalculator';
import RebalanceCalculator from '@/components/RebalanceCalculator';
import { Calculator, Upload, Flame, TrendingUp, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Tools() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Financial Tools</h1>
          <p className="text-muted-foreground">
            Professional-grade tools for portfolio management and financial planning
          </p>
        </div>

        <Tabs defaultValue="fire" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="fire" className="gap-2">
              <Flame className="w-4 h-4" />
              FIRE
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="dca" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              DCA
            </TabsTrigger>
            <TabsTrigger value="rebalance" className="gap-2">
              <Scale className="w-4 h-4" />
              Rebalance
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Calculator className="w-4 h-4" />
              Tax
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fire" className="space-y-4">
            <FIRECalculator />
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <CSVImport 
              onImportComplete={() => {
                toast({
                  title: 'Import Complete',
                  description: 'Transactions imported successfully. Check your portfolio.',
                });
              }}
            />
          </TabsContent>

          <TabsContent value="dca" className="space-y-4">
            <DCACalculator />
          </TabsContent>

          <TabsContent value="rebalance" className="space-y-4">
            <RebalanceCalculator />
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <TaxCalculator holdings={[]} />
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Note:</p>
              <p>The tax calculator will analyze your holdings from the Portfolio page. 
              Make sure you have added your assets with purchase prices to get accurate tax estimates.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
