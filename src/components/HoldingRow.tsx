import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Save, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Holding {
  id: string;
  asset_symbol: string;
  asset_name: string;
  amount: number;
  price_usd: number;
  value_usd: number;
  last_updated_at: string;
  asset_type: string;
  purchase_price_usd?: number;
  purchase_date?: string;
  notes?: string;
}

export function HoldingRow({ holding, onDelete, onUpdate }: { 
  holding: Holding; 
  onDelete: (id: string) => void;
  onUpdate?: () => void;
}) {
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(holding.notes || '');
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portfolio_holdings')
        .update({ notes })
        .eq('id', holding.id);

      if (error) throw error;

      toast({
        title: 'Notes Saved',
        description: 'Your notes have been updated successfully',
      });
      setIsEditingNotes(false);
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setNotes(holding.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-lg">{holding.asset_symbol}</p>
              <p className="text-sm text-muted-foreground">
                {holding.asset_name || holding.asset_symbol}
                <Badge variant="outline" className="ml-2">{holding.asset_type}</Badge>
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-right mr-4">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="font-semibold">
            {Number(holding.amount).toFixed(8)} {holding.asset_symbol}
          </p>
        </div>

        <div className="text-right mr-4">
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="font-semibold">
            ${(Number(holding.price_usd) || 0).toLocaleString(undefined, { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </p>
        </div>

        <div className="text-right mr-4">
          <p className="text-sm text-muted-foreground">Value</p>
          <p className="font-bold text-lg">
            ${(Number(holding.value_usd) || 0).toLocaleString(undefined, { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className="text-primary hover:text-primary"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(holding.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notes Section */}
      {(isEditingNotes || holding.notes) && (
        <div className="mt-3 pt-3 border-t border-border">
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes or comments about this holding..."
                className="min-h-[80px]"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveNotes}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Notes:</p>
              <p className="whitespace-pre-wrap">{holding.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
