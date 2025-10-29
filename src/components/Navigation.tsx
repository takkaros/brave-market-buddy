import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Settings,
  LogOut,
  User,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/portfolio', label: 'Portfolio', icon: Wallet },
    { path: '/economics', label: 'Economics', icon: Globe },
    { path: '/crypto', label: 'Crypto', icon: Bitcoin },
    { path: '/housing', label: 'Housing', icon: Home },
    { path: '/stocks', label: 'Stocks', icon: TrendingUp },
    { path: '/metals', label: 'Metals', icon: Coins },
    { path: '/bonds', label: 'Bonds', icon: CreditCard },
    { path: '/indicators', label: 'All Indicators', icon: BarChart3 },
    { path: '/chat', label: 'AI Chat', icon: MessageSquare },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="glass-card rounded-2xl p-2 md:p-4 mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2 overflow-x-auto flex-1 pb-2 md:pb-0">
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
                  'gap-2 whitespace-nowrap text-xs md:text-sm',
                  isActive && 'bg-primary'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </div>
        
        {user && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Badge variant="outline" className="gap-1 hidden md:flex">
              <User className="w-3 h-3" />
              {user.email}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2 w-full md:w-auto"
            >
              <LogOut className="w-4 h-4" />
              <span className="sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
