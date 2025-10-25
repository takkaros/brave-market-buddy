import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    toast({
      title: "Settings Saved",
      description: "Your OpenAI API key has been saved securely",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
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
            <p className="text-muted-foreground">Configure your AI Wealth Navigator</p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>OpenAI API Configuration</CardTitle>
              <CardDescription>
                Add your OpenAI API key to enable live AI analysis. Your key is stored locally and never sent to our servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>

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
              <CardTitle>About AI Wealth Navigator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Version: 1.0.0</p>
              <p>Economic Indicators: 35</p>
              <p>Data Sources: Demo Mode (Add API key for live data)</p>
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

export default Settings;
