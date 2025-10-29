import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Save, Trash2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIProvider {
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  description: string;
  docsUrl: string;
  placeholder: string;
  example: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'OpenAI',
    provider: 'openai',
    description: 'Use your own OpenAI API key for GPT models',
    docsUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...',
    example: 'sk-proj-abcd1234...'
  },
  {
    name: 'Anthropic (Claude)',
    provider: 'anthropic',
    description: 'Use your own Anthropic API key for Claude models',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
    example: 'sk-ant-api03-abcd1234...'
  },
  {
    name: 'Google AI',
    provider: 'google',
    description: 'Use your own Google AI API key for Gemini models',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/api-key',
    placeholder: 'AIza...',
    example: 'AIzaSyAbcd1234...'
  }
];

export default function AIProviderKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<Record<string, { value: string; hasKey: boolean; show: boolean }>>({
    openai: { value: '', hasKey: false, show: false },
    anthropic: { value: '', hasKey: false, show: false },
    google: { value: '', hasKey: false, show: false },
  });

  useEffect(() => {
    if (user) {
      loadKeys();
    }
  }, [user]);

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('provider, id')
        .eq('user_id', user!.id);

      if (error) throw error;

      if (data) {
        const newKeys = { ...keys };
        data.forEach((item) => {
          newKeys[item.provider] = { ...newKeys[item.provider], hasKey: true };
        });
        setKeys(newKeys);
      }
    } catch (error: any) {
      console.error('Error loading keys:', error);
    }
  };

  const saveKey = async (provider: 'openai' | 'anthropic' | 'google') => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save your API keys',
        variant: 'destructive',
      });
      return;
    }

    const keyValue = keys[provider].value.trim();
    
    // Validate API key format
    const providerConfig = AI_PROVIDERS.find(p => p.provider === provider);
    if (!keyValue) {
      toast({
        title: 'Missing API Key',
        description: 'Please enter an API key before saving',
        variant: 'destructive',
      });
      return;
    }

    // Basic format validation
    const validPrefixes: Record<string, string> = {
      openai: 'sk-',
      anthropic: 'sk-ant-',
      google: 'AIza'
    };

    if (!keyValue.startsWith(validPrefixes[provider])) {
      toast({
        title: 'Invalid API Key Format',
        description: `${providerConfig?.name} API keys should start with "${validPrefixes[provider]}"`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use encrypt_secret function to encrypt the key
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_secret', { secret_text: keyValue });

      if (encryptError) {
        console.error('Encryption error:', encryptError);
        throw new Error('Failed to encrypt API key. Please try again.');
      }

      // Upsert the encrypted key
      const { error: upsertError } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          provider,
          api_key_encrypted: encryptedData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        });

      if (upsertError) {
        console.error('Database error:', upsertError);
        throw new Error('Failed to save API key to database');
      }

      setKeys(prev => ({
        ...prev,
        [provider]: { value: '', hasKey: true, show: false }
      }));

      toast({
        title: '✓ API Key Saved',
        description: `Your ${providerConfig?.name} key is now securely stored and ready to use`,
      });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (provider: 'openai' | 'anthropic' | 'google') => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) {
        console.error('Delete error:', error);
        throw new Error('Failed to remove API key');
      }

      setKeys(prev => ({
        ...prev,
        [provider]: { value: '', hasKey: false, show: false }
      }));

      toast({
        title: '✓ API Key Removed',
        description: `${AI_PROVIDERS.find(p => p.provider === provider)?.name} key has been securely deleted`,
      });
    } catch (error: any) {
      toast({
        title: 'Removal Failed',
        description: error.message || 'Could not remove API key. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = (provider: string) => {
    setKeys(prev => ({
      ...prev,
      [provider]: { ...prev[provider], show: !prev[provider].show }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider API Keys</CardTitle>
        <CardDescription>
          Add your own API keys to use external AI providers without Lovable credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-sm">
            <strong className="text-primary">🔒 Bank-Level Security:</strong> Your API keys are encrypted using military-grade encryption before storage. They're never visible to anyone and can only be accessed by your secure backend functions.
          </AlertDescription>
        </Alert>

        {AI_PROVIDERS.map((provider) => (
          <div key={provider.provider} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">{provider.name}</Label>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Get API Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {keys[provider.provider].hasKey && (
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                    ✓ Configured
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {!keys[provider.provider].hasKey && (
                <>
                  <div className="relative">
                    <Input
                      type={keys[provider.provider].show ? 'text' : 'password'}
                      placeholder={provider.placeholder}
                      value={keys[provider.provider].value}
                      onChange={(e) => setKeys(prev => ({
                        ...prev,
                        [provider.provider]: { ...prev[provider.provider], value: e.target.value }
                      }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => toggleShowKey(provider.provider)}
                    >
                      {keys[provider.provider].show ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: {provider.example}
                  </p>
                </>
              )}

              <div className="flex gap-2">
                {!keys[provider.provider].hasKey ? (
                  <Button
                    onClick={() => saveKey(provider.provider)}
                    disabled={loading || !keys[provider.provider].value}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Key
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setKeys(prev => ({
                          ...prev,
                          [provider.provider]: { ...prev[provider.provider], hasKey: false, value: '' }
                        }));
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Update Key
                    </Button>
                    <Button
                      onClick={() => deleteKey(provider.provider)}
                      disabled={loading}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
