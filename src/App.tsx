import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Crypto from "./pages/Crypto";
import Housing from "./pages/Housing";
import Stocks from "./pages/Stocks";
import Metals from "./pages/Metals";
import Bonds from "./pages/Bonds";
import AIChat from "./pages/AIChat";
import Indicators from "./pages/Indicators";
import EnhancedSettings from "./pages/EnhancedSettings";
import PortfolioBuilder from "./pages/PortfolioBuilder";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/housing" element={<Housing />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/metals" element={<Metals />} />
          <Route path="/bonds" element={<Bonds />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/indicators" element={<Indicators />} />
          <Route path="/portfolio-builder" element={<PortfolioBuilder />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/settings" element={<EnhancedSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
