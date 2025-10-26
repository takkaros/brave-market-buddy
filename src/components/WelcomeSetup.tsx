import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";

interface WelcomeSetupProps {
  onComplete: () => void;
}

interface SetupStep {
  title: string;
  description: string;
  completed: boolean;
  action?: string;
}

export const WelcomeSetup = ({ onComplete }: WelcomeSetupProps) => {
  const steps: SetupStep[] = [
    {
      title: "Connect Your Portfolio",
      description: "Link your crypto wallets and exchange accounts to track all your holdings in one place",
      completed: false,
      action: "Go to Portfolio"
    },
    {
      title: "Add Manual Holdings",
      description: "Add stocks, bonds, real estate, and other assets manually",
      completed: false,
      action: "Add Holdings"
    },
    {
      title: "View Economic Data",
      description: "Economic indicators are being loaded automatically",
      completed: true,
    },
  ];

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎉 Welcome to Your Financial Command Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Get started by setting up your portfolio connections. We'll help you track everything in one place.
        </p>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {step.action && !step.completed && (
                <Button size="sm" variant="outline">
                  {step.action}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={onComplete} className="flex-1">
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
