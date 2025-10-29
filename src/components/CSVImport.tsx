import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface CSVImportProps {
  onImportComplete?: () => void;
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      previewCSV(selectedFile);
    }
  };

  const previewCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const previewData = lines.slice(1, 4).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });
        return row;
      });
      
      setPreview(previewData);
    };
    reader.readAsText(file);
  };

  const importCSV = async () => {
    if (!file || !user) return;
    
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Parse CSV into trades
        const trades = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
          });
          
          // Map common CSV formats
          const symbol = row.symbol || row.asset || row.coin || row.ticker;
          const side = (row.side || row.type || '').toLowerCase().includes('buy') ? 'buy' : 'sell';
          const quantity = parseFloat(row.quantity || row.amount || row.size || 0);
          const price = parseFloat(row.price || row.rate || 0);
          const date = row.date || row.timestamp || row.time;
          const exchange = row.exchange || row.platform || 'manual_import';
          
          if (symbol && quantity && price) {
            trades.push({
              user_id: user.id,
              symbol: symbol.toUpperCase(),
              asset_type: 'crypto',
              side,
              quantity,
              price,
              total_usd: quantity * price,
              exchange,
              executed_at: new Date(date || Date.now()).toISOString(),
              commission_usd: parseFloat(row.fee || row.commission || 0),
            });
          }
        }

        // Insert trades into database
        const { error } = await supabase
          .from('trades')
          .insert(trades);

        if (error) throw error;

        setImportedCount(trades.length);
        
        toast({
          title: 'Import Successful',
          description: `Imported ${trades.length} transactions`,
        });

        setFile(null);
        setPreview([]);
        onImportComplete?.();
      };
      
      reader.readAsText(file);
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          CSV Import
        </CardTitle>
        <CardDescription>
          Import your transaction history from exchanges or wallets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">Required CSV Format:</p>
          <p className="text-xs text-muted-foreground mb-2">
            Your CSV should include these columns (column names are flexible):
          </p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Symbol/Asset/Coin (e.g., BTC, ETH)</li>
            <li>• Side/Type (buy or sell)</li>
            <li>• Quantity/Amount/Size</li>
            <li>• Price/Rate (in USD)</li>
            <li>• Date/Timestamp (optional)</li>
            <li>• Exchange/Platform (optional)</li>
            <li>• Fee/Commission (optional)</li>
          </ul>
        </div>

        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {file ? file.name : 'Click to upload CSV'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports most exchange export formats
            </p>
          </label>
        </div>

        {preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Preview (first 3 rows)
            </p>
            <div className="bg-muted/30 p-3 rounded text-xs overflow-x-auto">
              <pre>{JSON.stringify(preview, null, 2)}</pre>
            </div>
          </div>
        )}

        <Button 
          onClick={importCSV} 
          disabled={!file || importing}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Importing...' : 'Import Transactions'}
        </Button>

        {importedCount > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold">Successfully imported {importedCount} transactions</p>
                  <p className="text-xs text-muted-foreground">View your trades in the Portfolio or Orders page</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Orders
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          All data stays local. Transactions are stored in your secure database.
        </p>
      </CardContent>
    </Card>
  );
}
