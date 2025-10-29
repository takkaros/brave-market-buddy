import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Crypto from "./pages/Crypto";
import Housing from "./pages/Housing";
import Stocks from "./pages/Stocks";
import Metals from "./pages/Metals";
import Bonds from "./pages/Bonds";
import AIChat from "./pages/AIChat";
import Indicators from "./pages/Indicators";
import EnhancedSettings from "./pages/EnhancedSettings";
import Portfolio from "./pages/Portfolio";
import Economics from "./pages/Economics";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crypto" element={<Crypto />} />
              <Route path="/housing" element={<Housing />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/metals" element={<Metals />} />
              <Route path="/bonds" element={<Bonds />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="/indicators" element={<Indicators />} />
              <Route path="/economics" element={<Economics />} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/settings" element={<EnhancedSettings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
