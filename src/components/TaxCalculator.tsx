import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TaxSummary {
  totalGains: number;
  totalLosses: number;
  netGains: number;
  taxOwed: number;
  taxYear: number;
}

interface TaxCalculatorProps {
  holdings: any[];
}

export default function TaxCalculator({ holdings }: TaxCalculatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateTax = async () => {
    if (!user) return;
    
    setCalculating(true);
    try {
      // Calculate gains/losses based on purchase price vs current price
      let totalGains = 0;
      let totalLosses = 0;

      holdings.forEach(holding => {
        if (holding.purchase_price_usd && holding.price_usd) {
          const costBasis = holding.amount * holding.purchase_price_usd;
          const currentValue = holding.amount * holding.price_usd;
          const gainLoss = currentValue - costBasis;

          if (gainLoss > 0) {
            totalGains += gainLoss;
          } else {
            totalLosses += Math.abs(gainLoss);
          }
        }
      });

      const netGains = totalGains - totalLosses;
      
      // Cyprus crypto tax (2025):
      // - NO Capital Gains Tax on crypto for individuals (Cyprus has no CGT on financial assets)
      // - Income tax applies ONLY if crypto trading is considered a business activity
      // - For casual investors: 0% tax on crypto gains
      // - For professional traders: Income tax 0-35% progressive
      // - Companies: 12.5% corporate tax
      // Default assumption: Casual investor = 0% tax
      // If trading as business, personal income tax applies on net gains
      const taxOwed = 0; // Cyprus has no CGT for individuals on crypto

      const summary = {
        totalGains,
        totalLosses,
        netGains,
        taxOwed,
        taxYear: new Date().getFullYear(),
      };

      setTaxSummary(summary);

      // Save to database
      await supabase.from('tax_calculations').insert({
        user_id: user.id,
        tax_year: summary.taxYear,
        asset_type: 'all',
        total_gains: totalGains,
        total_losses: totalLosses,
        net_gains: netGains,
        tax_owed: taxOwed,
        jurisdiction: 'cyprus',
        calculation_data: { holdings: holdings.length },
      });

      toast({
        title: 'Tax Calculated',
        description: 'Cyprus tax estimation completed',
      });
    } catch (error: any) {
      toast({
        title: 'Calculation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const exportTaxReport = () => {
    if (!taxSummary) return;

    const report = `
Cyprus Crypto Tax Report - ${taxSummary.taxYear}
================================================

Total Capital Gains: €${taxSummary.totalGains.toFixed(2)}
Total Capital Losses: €${taxSummary.totalLosses.toFixed(2)}
Net Capital Gains: €${taxSummary.netGains.toFixed(2)}

Estimated Tax Owed: €${taxSummary.taxOwed.toFixed(2)}

================================================
TAX TREATMENT FOR CASUAL INVESTORS (2025):
✓ NO Capital Gains Tax on cryptocurrency
✓ Cyprus does not tax capital gains on financial assets
✓ Only income tax applies if trading is a business activity

IMPORTANT CONSIDERATIONS:
- Casual/personal investors: 0% tax on crypto gains
- Professional traders (business activity): Income tax 0-35% applies
- Corporate entities: 12.5% corporate tax rate
- Non-domiciled residents: No SDC on dividends for 17 years
- No VAT on cryptocurrency transactions
- Tax Year: January 1 - December 31
- Personal tax filing deadline: July 31 following tax year
- Corporate tax filing: March 31 (12 months after year-end)

RECORD KEEPING REQUIREMENTS:
- Keep detailed records of all transactions
- Document purchase dates, amounts, and prices
- Retain proof of transfers and wallet addresses
- Maintain exchange statements

================================================
DISCLAIMER: This is an estimate for informational purposes only.
Cyprus tax law is subject to interpretation by tax authorities.
Consult a qualified Cyprus tax advisor or accountant for personalized advice.

The classification between "casual investor" and "professional trader" 
depends on factors like trading frequency, volume, and intent.

Generated: ${new Date().toISOString()}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyprus-tax-report-${taxSummary.taxYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'Cyprus tax report exported successfully',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Cyprus Tax Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Cyprus Crypto Tax (2025):</strong>
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong className="text-green-600">NO Capital Gains Tax</strong> on crypto for individuals</li>
            <li>• Casual investors: <strong className="text-green-600">0% tax</strong> on crypto gains</li>
            <li>• Professional traders: Income tax 0-35% (if trading = business)</li>
            <li>• Corporate entities: 12.5% corporate tax applies</li>
            <li>• Non-dom advantages: No SDC on dividends for 17 years</li>
            <li>• No VAT on crypto transactions</li>
          </ul>
        </div>

        {!taxSummary ? (
          <Button 
            onClick={calculateTax} 
            disabled={calculating || holdings.length === 0}
            className="w-full"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {calculating ? 'Calculating...' : 'Calculate Tax Liability'}
          </Button>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Total Gains</span>
                </div>
                <span className="font-semibold text-green-500">
                  €{taxSummary.totalGains.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Total Losses</span>
                </div>
                <span className="font-semibold text-red-500">
                  €{taxSummary.totalLosses.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">Net Gains</span>
                <span className="font-bold text-lg">
                  €{taxSummary.netGains.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border-2 border-green-500/20">
                <div>
                  <span className="font-semibold block">Estimated Tax Owed</span>
                  <span className="text-xs text-muted-foreground">Casual investor - no CGT</span>
                </div>
                <span className="font-bold text-xl text-green-600">
                  €{taxSummary.taxOwed.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={exportTaxReport} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={calculateTax} variant="outline">
                <Calculator className="w-4 h-4 mr-2" />
                Recalculate
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This is an estimate. Consult a Cyprus tax professional for accurate filing.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
