import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Trash2, Check, X, TrendingUp, TrendingDown, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
  connection_id?: string | null;
}

interface HoldingRowProps {
  holding: Holding;
  onUpdate?: () => void;
  onDelete: (id: string) => void;
  onHide?: (id: string) => void;
  connectionLabel?: string;
}

const HoldingRow = ({ holding, onUpdate, onDelete, onHide, connectionLabel }: HoldingRowProps) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [notes, setNotes] = useState(holding.notes || '');
  const [amount, setAmount] = useState(holding.amount.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [previousValue, setPreviousValue] = useState<{ amount?: number; notes?: string }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mockChange = ((holding.value_usd || 0) * 0.02); // Mock 2% change

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) clearTimeout(saveTimeoutRef.current);
      if (undoTimeoutRef.current !== null) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const handleNotesUpdate = async (newNotes: string) => {
    setIsSaving(true);
    setPreviousValue({ notes: holding.notes || '' });

    try {
      const { error } = await supabase
        .from('portfolio_holdings')
        .update({ notes: newNotes })
        .eq('id', holding.id);

      if (error) throw error;

      setShowUndo(true);
      if (onUpdate) onUpdate();

      if (undoTimeoutRef.current !== null) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => setShowUndo(false), 5000);
    } catch (error) {
      toast.error('Failed to update notes');
      setNotes(holding.notes || '');
    } finally {
      setIsSaving(false);
      setEditingNotes(false);
    }
  };

  const handleAmountUpdate = async (newAmount: number) => {
    setIsSaving(true);
    setPreviousValue({ amount: holding.amount });

    const newValue = newAmount * (holding.price_usd || 0);

    try {
      const { error } = await supabase
        .from('portfolio_holdings')
        .update({ amount: newAmount, value_usd: newValue })
        .eq('id', holding.id);

      if (error) throw error;

      setShowUndo(true);
      if (onUpdate) onUpdate();

      if (undoTimeoutRef.current !== null) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => setShowUndo(false), 5000);
    } catch (error) {
      toast.error('Failed to update amount');
      setAmount(holding.amount.toString());
    } finally {
      setIsSaving(false);
      setEditingAmount(false);
    }
  };

  const handleUndo = async () => {
    try {
      const updates: any = {};
      if (previousValue.amount !== undefined) {
        updates.amount = previousValue.amount;
        updates.value_usd = previousValue.amount * (holding.price_usd || 0);
        setAmount(previousValue.amount.toString());
      }
      if (previousValue.notes !== undefined) {
        updates.notes = previousValue.notes;
        setNotes(previousValue.notes);
      }

      const { error } = await supabase
        .from('portfolio_holdings')
        .update(updates)
        .eq('id', holding.id);

      if (error) throw error;

      toast.success('Changes undone');
      setShowUndo(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to undo changes');
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (saveTimeoutRef.current !== null) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleNotesUpdate(value), 1000);
  };

  const handleAmountBlur = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && numAmount <= 1e15 && numAmount !== holding.amount) {
      handleAmountUpdate(numAmount);
    } else {
      setAmount(holding.amount.toString());
      setEditingAmount(false);
      if (numAmount > 1e15) {
        toast.error('Amount too large');
      }
    }
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{holding.asset_symbol}</h3>
            <Badge variant="outline" className="text-xs">{holding.asset_type}</Badge>
            {connectionLabel && (
              <Badge variant="secondary" className="text-xs">
                {connectionLabel}
              </Badge>
            )}
          </div>
          {holding.asset_name && (
            <p className="text-sm text-muted-foreground">{holding.asset_name}</p>
          )}
        </div>
        
        <div className="text-right">
          <p className="font-bold text-lg">
            ${(holding.value_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center justify-end gap-1 text-sm ${mockChange >= 0 ? 'text-risk-low' : 'text-risk-high'}`}>
            {mockChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{mockChange >= 0 ? '+' : ''}{mockChange.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Amount</p>
          {editingAmount ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={handleAmountBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAmountBlur();
                  if (e.key === 'Escape') {
                    setAmount(holding.amount.toString());
                    setEditingAmount(false);
                  }
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleAmountBlur} className="h-8 w-8 p-0">
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button 
              onClick={() => setEditingAmount(true)} 
              className="font-medium hover:text-primary transition-colors text-left"
            >
              {holding.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
            </button>
          )}
        </div>

        <div>
          <p className="text-muted-foreground mb-1">Price</p>
          <p className="font-medium">
            ${(holding.price_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {(editingNotes || notes) && (
        <div className="pt-3 border-t border-border">
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full min-h-[60px]"
                placeholder="Add notes..."
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setNotes(holding.notes || '');
                    setEditingNotes(false);
                  }}
                  disabled={isSaving}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleNotesUpdate(notes)} 
                  disabled={isSaving}
                >
                  <Check className="w-3 h-3 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes:</p>
              <p className="text-sm whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingNotes(!editingNotes)}
            aria-label="Edit notes"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8 w-8 p-0"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          {onHide && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onHide(holding.id)}
              aria-label="Hide holding"
              title="Hide this holding (won't be updated during syncs)"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(holding.id)}
            aria-label="Delete holding"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {showUndo && (
          <Button size="sm" variant="outline" onClick={handleUndo}>
            Undo
          </Button>
        )}
      </div>
    </div>
  );
};

export { HoldingRow };
