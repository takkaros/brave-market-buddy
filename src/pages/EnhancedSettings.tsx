import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import InfoTooltip from '@/components/InfoTooltip';

interface APIKey {
  name: string;
  key: string;
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  docsUrl: string;
  placeholder: string;
}

const EnhancedSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      name: 'OpenAI',
      key: '',
      status: 'disconnected',
      description: 'Required for AI analysis and chat features',
      docsUrl: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-...',
    },
    {
      name: 'FRED',
      key: '',
      status: 'disconnected',
      description: 'Federal Reserve Economic Data - most economic indicators',
      docsUrl: 'https://fred.stlouisfed.org/docs/api/api_key.html',
      placeholder: 'abcdef123456...',
    },
    {
      name: 'Alpha Vantage',
      key: '',
      status: 'disconnected',
      description: 'Stock market data, VIX, market indicators',
      docsUrl: 'https://www.alphavantage.co/support/#api-key',
      placeholder: 'DEMO (or your key)',
    },
    {
      name: 'Yahoo Finance',
      key: '',
      status: 'disconnected',
      description: 'Alternative source for market data',
      docsUrl: 'https://www.yahoofinanceapi.com/',
      placeholder: 'optional',
    },
  ]);

  useEffect(() => {
    // Load saved keys
    const saved = apiKeys.map(api => {
      const storedKey = localStorage.getItem(`api_key_${api.name.toLowerCase().replace(' ', '_')}`) || '';
      return {
        ...api,
        key: storedKey,
        status: (storedKey ? 'connected' : 'disconnected') as 'connected' | 'disconnected' | 'error',
      };
    });
    setApiKeys(saved);
  }, []);

  const updateKey = (name: string, value: string) => {
    setApiKeys(prev => prev.map(api => 
      api.name === name ? { ...api, key: value } : api
    ));
  };

  const saveKey = (name: string) => {
    const api = apiKeys.find(a => a.name === name);
    if (api) {
      const storageKey = `api_key_${name.toLowerCase().replace(' ', '_')}`;
      localStorage.setItem(storageKey, api.key);
      
      setApiKeys(prev => prev.map(a => 
        a.name === name ? { ...a, status: (api.key ? 'connected' : 'disconnected') as 'connected' | 'disconnected' | 'error' } : a
      ));

      toast({
        title: "API Key Saved",
        description: `${name} API key has been saved securely`,
      });
    }
  };

  const removeKey = (name: string) => {
    const storageKey = `api_key_${name.toLowerCase().replace(' ', '_')}`;
    localStorage.removeItem(storageKey);
    
    setApiKeys(prev => prev.map(a => 
      a.name === name ? { ...a, key: '', status: 'disconnected' } : a
    ));

    toast({
      title: "API Key Removed",
      description: `${name} API key has been removed`,
    });
  };

  const connectedCount = apiKeys.filter(a => a.status === 'connected').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Configure API keys to enable real-time data and AI features
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>API Connection Status</CardTitle>
              <CardDescription>
                {connectedCount} of {apiKeys.length} data sources connected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${
                  connectedCount === apiKeys.length ? 'bg-risk-low' :
                  connectedCount > 0 ? 'bg-risk-moderate' :
                  'bg-risk-critical'
                }`} />
                <span>
                  {connectedCount === apiKeys.length ? 'All systems connected' :
                   connectedCount > 0 ? 'Some connections missing' :
                   'No connections configured'}
                </span>
              </div>
            </CardContent>
          </Card>

          {apiKeys.map((api, index) => (
            <Card key={api.name} className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{api.name}</CardTitle>
                    {api.status === 'connected' ? (
                      <CheckCircle2 className="w-5 h-5 text-risk-low" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                      Get API Key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
                <CardDescription>{api.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`api-${index}`} className="flex items-center">
                    API Key
                    <InfoTooltip 
                      content="Your API key is stored locally in your browser and never sent to our servers. It's only used to fetch data directly from the provider."
                    />
                  </Label>
                  <Input
                    id={`api-${index}`}
                    type="password"
                    value={api.key}
                    onChange={(e) => updateKey(api.name, e.target.value)}
                    placeholder={api.placeholder}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => saveKey(api.name)} 
                    className="gap-2"
                    disabled={!api.key}
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  {api.status === 'connected' && (
                    <Button 
                      onClick={() => removeKey(api.name)} 
                      variant="outline"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Separator />

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Risk Tolerance</CardTitle>
              <CardDescription>
                Adjust your risk preferences to personalize recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">Conservative</Button>
                  <Button variant="default" size="sm">Moderate</Button>
                  <Button variant="outline" size="sm">Aggressive</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current setting: Moderate (balanced risk/reward approach)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>About Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-1">Federal Reserve (FRED)</p>
                <p>Provides official U.S. economic data: unemployment, inflation, GDP, credit spreads, and more. Most reliable source for macro indicators. Free API with generous rate limits.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Alpha Vantage</p>
                <p>Stock market data, VIX volatility index, technical indicators. Free tier includes 500 requests/day. Premium plans available for real-time data.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">OpenAI</p>
                <p>Powers the AI Market Navigator and chat features. Analyzes all indicators and provides personalized investment advice. Pay-per-use pricing.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Privacy & Security</p>
                <p>All API keys are stored locally in your browser using localStorage. They are never transmitted to our servers. Keys are only used to make direct requests to data providers.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>About AI Wealth Navigator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Version: 1.0.0</p>
              <p>Economic Indicators: 35</p>
              <p>Data Sources: {connectedCount > 0 ? `${connectedCount} connected` : 'Demo Mode'}</p>
              <p className="pt-4 text-xs">
                This tool provides educational guidance only. Not financial advice. 
                Consult a licensed advisor before making investment decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettings;
