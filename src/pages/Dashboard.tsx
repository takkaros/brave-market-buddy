import { useState } from 'react';
import { generateMockData, generateHistoricalData } from '@/utils/mockData';
import { calculateRiskScore } from '@/utils/riskCalculator';
import RiskGauge from '@/components/RiskGauge';
import CategoryCard from '@/components/CategoryCard';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import RiskTrendChart from '@/components/RiskTrendChart';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Settings, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const mockData = generateMockData('bottom');
  const historicalData = generateHistoricalData(180);
  const { score, categories } = calculateRiskScore(mockData);
  const previousScore = historicalData[historicalData.length - 30]?.score;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">AI Wealth Navigator</h1>
            <p className="text-muted-foreground">Real-time economic risk analysis with AI-powered investment guidance</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/chat')}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Alert Banner */}
        <div className="glass-card rounded-lg p-4 border-l-4 border-risk-moderate">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-risk-moderate" />
            <div>
              <p className="font-medium">Market Opportunity Detected</p>
              <p className="text-sm text-muted-foreground">
                Risk declining from 67 → {score}. Fear & Greed at {mockData.fearGreedIndex}. 
                Contrarian buy signal strengthening.
              </p>
            </div>
          </div>
        </div>

        {/* Main Risk Gauge */}
        <RiskGauge score={score} previousScore={previousScore} />

        {/* AI Analysis */}
        <AIAnalysisPanel 
          riskScore={score} 
          fearGreedIndex={mockData.fearGreedIndex}
          onOpenChat={() => navigate('/chat')}
        />

        {/* Risk Trend Chart */}
        <RiskTrendChart data={historicalData} />

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.name} category={category} />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Data Quality</p>
            <p className="text-2xl font-bold text-risk-low">95%</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Indicators</p>
            <p className="text-2xl font-bold">35</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
            <p className="text-2xl font-bold">Live</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Anomalies</p>
            <p className="text-2xl font-bold text-risk-elevated">2</p>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="glass-card rounded-lg p-4 text-center text-sm text-muted-foreground">
          <p>Using demo data. Add OpenAI API key in Settings for live AI analysis.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
