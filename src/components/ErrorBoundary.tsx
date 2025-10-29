import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Wrapper to access useNavigate in class component
function withNavigation(Component: any) {
  return (props: any) => {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}

class ErrorBoundaryClass extends Component<Props & { navigate: any }, State> {
  constructor(props: Props & { navigate: any }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <CardTitle>Something Went Wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                An unexpected error occurred. Please try reloading the page or return to the homepage.
              </p>
              {this.state.error && (
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} variant="default">
                  Reload Page
                </Button>
                <Button onClick={() => this.props.navigate('/')} variant="outline">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundary = withNavigation(ErrorBoundaryClass);

export default ErrorBoundary;
