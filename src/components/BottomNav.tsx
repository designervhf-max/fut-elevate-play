import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, Search } from 'lucide-react';

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/games', icon: Calendar, label: 'Jogos' },
  { path: '/search', icon: Search, label: 'Buscar' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                isActive 
                  ? 'text-primary scale-110' 
                  : 'text-muted-foreground hover:text-foreground hover:scale-105'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 transition-transform ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
