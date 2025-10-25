import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Bitcoin, 
  Home, 
  TrendingUp, 
  Coins,
  CreditCard,
  BarChart3,
  MessageSquare,
  Target,
  Wallet,
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/crypto', label: 'Crypto', icon: Bitcoin },
    { path: '/housing', label: 'Housing', icon: Home },
    { path: '/stocks', label: 'Stocks', icon: TrendingUp },
    { path: '/metals', label: 'Metals', icon: Coins },
    { path: '/bonds', label: 'Bonds', icon: CreditCard },
    { path: '/indicators', label: 'All Indicators', icon: BarChart3 },
    { path: '/portfolio-builder', label: 'Portfolio Builder', icon: Target },
    { path: '/portfolio', label: 'Portfolio', icon: Wallet },
    { path: '/chat', label: 'AI Chat', icon: MessageSquare },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="glass-card rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                'gap-2 whitespace-nowrap',
                isActive && 'bg-primary'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
