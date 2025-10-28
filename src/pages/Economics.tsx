import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Globe,
  MapPin,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Indicator {
  code: string;
  name: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  unit?: string;
}

export default function Economics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [globalIndicators, setGlobalIndicators] = useState<Indicator[]>([]);
  const [cyprusIndicators, setCyprusIndicators] = useState<Indicator[]>([]);
  const [euIndicators, setEuIndicators] = useState<Indicator[]>([]);

  const fetchIndicators = async () => {
    setLoading(true);
    try {
      // Fetch from database cache
      const { data, error } = await supabase
        .from('economic_indicators')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by region
      const global = data?.filter(d => d.region === 'global') || [];
      const cyprus = data?.filter(d => d.region === 'cyprus') || [];
      const eu = data?.filter(d => d.region === 'eu') || [];

      setGlobalIndicators(transformData(global));
      setCyprusIndicators(transformData(cyprus));
      setEuIndicators(transformData(eu));
    } catch (error: any) {
      toast({
        title: 'Failed to Load Data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const transformData = (data: any[]): Indicator[] => {
    return data.map(d => ({
      code: d.indicator_code,
      name: d.indicator_name,
      value: Number(d.value) || 0,
      trend: 'neutral' as const,
      unit: '%'
    }));
  };

    const syncData = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-economic-indicators', {
        body: { refresh: true }
      });

      if (error) throw error;

      toast({
        title: 'Data Synced',
        description: 'Economic indicators updated successfully',
      });

      fetchIndicators();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchIndicators();
      
      // If no data found, automatically sync for the first time
      if (globalIndicators.length === 0 && cyprusIndicators.length === 0 && euIndicators.length === 0) {
        syncData();
      }
    };
    
    loadData();
  }, []);

  const IndicatorCard = ({ indicator }: { indicator: Indicator }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{indicator.name}</p>
            <p className="text-2xl font-bold">
              {indicator.value.toFixed(2)}{indicator.unit}
            </p>
            {indicator.change && (
              <div className="flex items-center gap-1 mt-2">
                {indicator.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : indicator.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : null}
                <span className={`text-sm ${indicator.trend === 'up' ? 'text-green-500' : indicator.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {indicator.change > 0 ? '+' : ''}{indicator.change.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <Badge variant="outline">{indicator.code}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Economic Indicators</h1>
            <p className="text-muted-foreground">Track global, EU, and Cyprus economic data</p>
          </div>
          <Button onClick={syncData} variant="outline" disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global" className="gap-2">
              <Globe className="w-4 h-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="cyprus" className="gap-2">
              <MapPin className="w-4 h-4" />
              Cyprus
            </TabsTrigger>
            <TabsTrigger value="eu" className="gap-2">
              <MapPin className="w-4 h-4" />
              European Union
            </TabsTrigger>
            <TabsTrigger value="realestate" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Real Estate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Global Economic Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : globalIndicators.length === 0 ? (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Loading Economic Data</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        First-time setup in progress. Economic indicators are being fetched from Federal Reserve...
                      </p>
                      <Button onClick={syncData} disabled={syncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Loading...' : 'Retry'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {globalIndicators.map(indicator => (
                        <IndicatorCard key={indicator.code} indicator={indicator} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cyprus">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cyprus Economic Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : cyprusIndicators.length === 0 ? (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Loading Cyprus Data</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Economic indicators are being fetched...
                      </p>
                      <Button onClick={syncData} disabled={syncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Loading...' : 'Retry'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cyprusIndicators.map(indicator => (
                        <IndicatorCard key={indicator.code} indicator={indicator} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="eu">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>European Union Economic Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : euIndicators.length === 0 ? (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Loading EU Data</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Economic indicators are being fetched...
                      </p>
                      <Button onClick={syncData} disabled={syncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Loading...' : 'Retry'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {euIndicators.map(indicator => (
                        <IndicatorCard key={indicator.code} indicator={indicator} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realestate">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Real Estate Market Indicators</CardTitle>
                  <p className="text-sm text-muted-foreground">Key metrics for property investment analysis</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* US Housing Indicators */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">US Home Price Index</p>
                            <p className="text-2xl font-bold">285.4</p>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">+4.2%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <Badge variant="outline" className="mt-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                Moderate
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline">CSUSHPISA</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Mortgage Rates (30Y)</p>
                            <p className="text-2xl font-bold">6.85%</p>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingDown className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">-0.3%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <Badge variant="outline" className="mt-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                Moderate
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline">MORTGAGE30US</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Housing Starts (Annual)</p>
                            <p className="text-2xl font-bold">1.42M</p>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">+2.8%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <Badge variant="outline" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">
                                Low
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline">HOUST</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cyprus Housing */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Cyprus Property Prices</p>
                            <p className="text-2xl font-bold">118.5</p>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">+5.1%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <Badge variant="outline" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">
                                Low
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline">CY-HPI</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* EU Housing */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">EU House Price Index</p>
                            <p className="text-2xl font-bold">132.8</p>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">+3.7%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <Badge variant="outline" className="mt-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                Moderate
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline">EU-HPI</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Commercial Real Estate */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Commercial RE Index</p>
                            <p className="text-2xl font-bold">178.2</p>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-500">-1.2%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <Badge variant="outline" className="mt-1 bg-red-500/10 text-red-500 border-red-500/20">
                                High
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline">COMMRE</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium mb-2">Understanding Real Estate Metrics</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• <strong>Home Price Index:</strong> Tracks changes in residential property values</li>
                          <li>• <strong>Mortgage Rates:</strong> Average interest rates for 30-year fixed mortgages</li>
                          <li>• <strong>Housing Starts:</strong> Number of new residential construction projects begun annually</li>
                          <li>• <strong>Risk Levels:</strong> Low (favorable conditions), Moderate (stable), High (caution advised)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
