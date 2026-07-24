import { 
  Calendar, 
  FileText, 
  Users, 
  Home, 
  Clock, 
  Settings, 
  LogOut, 
  User, 
  Mail, 
  Shield, 
  Bell, 
  MessageSquare, 
  Database,
  ClipboardList,
  FileCheck,
  FileSignature,
  Receipt,
  TrendingUp,
  Car,
  Send,
  Loader2,
  AlertCircle,
  FileKey,
  ShoppingCart,
  ShoppingBag
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../auth/auth-context";
import { getMenuItems, getProfileBadge } from "../auth/permissions";
import { toast } from "sonner@2.0.3";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void; // Tornar opcional
}

export function Sidebar({
  activeTab,
  onTabChange
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get menu items based on user role
  const menuItems = getMenuItems(
    user?.role || 'externo',
    user?.department,
    user?.position
  );
  
  // Get badge info for the user profile
  const badgeInfo = getProfileBadge(
    user?.role || 'externo',
    user?.department,
    user?.position
  );
  
  // DEBUG: Log para verificar menu items
 console.log(' DEBUG Sidebar:', {
    userRole: user?.role,
    department: user?.department,
    position: user?.position,
    menuItemsCount: menuItems.length,
    menuItems: menuItems.map(item => ({ id: item.id, label: item.label, icon: item.icon })),
    badgeInfo: badgeInfo
  });
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    toast.info('Encerrando sessão...');
    
    try {
      await logout();
      toast.success('Sessão encerrada com sucesso');
    } catch (error) {
      // Não mostrar erro ao usuário - logout local sempre funciona
 console.log('Logout completed');
      toast.success('Sessão encerrada');
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const iconMap = {
    Home,
    FileText,
    Users,
    Calendar,
    Clock,
    Settings,
    Mail,
    Shield,
    Bell,
    MessageSquare,
    Database,
    ClipboardList,
    FileCheck,
    FileSignature,
    Receipt,
    TrendingUp,
    Car,
    Send,
    AlertCircle,
    FileKey,
    ShoppingCart,
    ShoppingBag
  } as const;

  return (
    <div className="w-64 bg-card border-r border-border h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-primary">Sistema Integrado de Gestão</h2>
        <p className="text-muted-foreground text-sm">Processos, Aprovações e Registos</p>
      </div>

      {/* User Info */}
      <div className="mb-6 p-3 bg-accent rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4" />
          <span className="font-medium text-sm">{user.name}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
        <Badge className={`${badgeInfo.color} text-white`}>{badgeInfo.label}</Badge>
      </div>
      
      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onTabChange(item.id)}
              data-tab={item.id}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Sair
        </Button>
      </div>
    </div>
  );
}