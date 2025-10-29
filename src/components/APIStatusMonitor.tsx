import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface APIStatus {
  status: 'connected' | 'error' | 'unknown';
  configured: boolean;
  error?: string;
}

interface HealthStatus {
  fred: APIStatus;
  alphaVantage: APIStatus;
  cryptoCompare: APIStatus;
  quandl: APIStatus;
  nasdaq: APIStatus;
  openai: APIStatus;
}

const APIStatusMonitor = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>("");
  const { toast } = useToast();

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-api-health');
      
      if (error) throw error;
      
      if (data?.success) {
        setHealthStatus(data.healthStatus);
        setLastCheck(new Date(data.timestamp).toLocaleTimeString());
        
        // Check for any API failures and notify
        const failedApis = Object.entries(data.healthStatus).filter(
          ([_, status]: [string, APIStatus]) => status.configured && status.status === 'error'
        );
        
        if (failedApis.length > 0) {
          toast({
            title: "API Connection Issues",
            description: `${failedApis.length} API(s) are experiencing connection issues`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: APIStatus) => {
    if (!status.configured) return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (status.status === 'connected') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status.status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: APIStatus) => {
    if (!status.configured) return <Badge variant="outline">Not Configured</Badge>;
    if (status.status === 'connected') return <Badge className="bg-green-500">Connected</Badge>;
    if (status.status === 'error') return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const apiNames = {
    fred: 'FRED (Economic Data)',
    alphaVantage: 'Alpha Vantage (Stocks)',
    cryptoCompare: 'CryptoCompare (Crypto)',
    quandl: 'Quandl (Financial Data)',
    nasdaq: 'Nasdaq Data Link',
    openai: 'OpenAI (AI Chat)',
  };

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">API Connection Status</h3>
          {lastCheck && (
            <p className="text-sm text-muted-foreground">Last checked: {lastCheck}</p>
          )}
        </div>
        <Button
          onClick={checkHealth}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Refresh API status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading && <span className="sr-only">Checking API status</span>}
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {healthStatus && Object.entries(healthStatus).map(([key, status]) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(status)}
              <div>
                <p className="font-medium">{apiNames[key as keyof typeof apiNames]}</p>
                {status.error && (
                  <p className="text-xs text-destructive mt-1">{status.error}</p>
                )}
              </div>
            </div>
            {getStatusBadge(status)}
          </div>
        ))}
      </div>

      {!healthStatus && !loading && (
        <p className="text-center text-muted-foreground py-8">
          Click refresh to check API status
        </p>
      )}
    </Card>
  );
};

export default APIStatusMonitor;
