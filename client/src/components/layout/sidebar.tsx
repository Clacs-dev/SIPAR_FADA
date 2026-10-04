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
  FileBarChart,
  TrendingUp,
  Car,
  Send,
  Loader2,
  AlertCircle,
  FileKey,
  ShoppingCart,
  ShoppingBag,
  DoorOpen,
  Building,
  Layers,
  KeyRound,
  Activity,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../auth/auth-context";
import { getMenuItems, getProfileBadge, filterMenuItemsByLicense, filterMenuItemsByPermissions } from "../auth/permissions";
import { useMyPermissions } from "../../hooks/use-my-permissions";
import { useLicense } from "../../hooks/use-license";
import { toast } from "sonner@2.0.3";
import { MeuPerfilDialog } from "./meu-perfil-dialog";
import siparMark from "@/assets/sipar-mark.png";

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
  const { data: licenseData } = useLicense();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  // Get menu items based on user role, depois esconder os que a licenca
  // activa desta instalacao nao inclui (ver filterMenuItemsByLicense).
  const { permissoes } = useMyPermissions();
  // ...e os que o role nao tem nas permissoes definidas pelo Administrador
  // do Sistema (ver filterMenuItemsByPermissions).
  const menuItems = filterMenuItemsByPermissions(
    filterMenuItemsByLicense(
      getMenuItems(
        user?.role || 'externo',
        user?.department,
        user?.position
      ),
      licenseData?.license?.modules
    ),
    permissoes
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
    FileBarChart,
    TrendingUp,
    Car,
    Send,
    AlertCircle,
    FileKey,
    ShoppingCart,
    ShoppingBag,
    DoorOpen,
    Building,
    Layers,
    KeyRound,
    Activity,
    Trash2
  } as const;

  return (
    <div
      className="w-64 h-screen p-4 flex flex-col overflow-hidden text-sidebar-foreground"
      style={{ background: 'linear-gradient(180deg, var(--sidebar) 0%, #17253f 100%)' }}
    >
      <div className="mb-6 pb-4 shrink-0 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-1">
          <img src={siparMark} alt="SIPAR" className="w-9 h-9 object-contain shrink-0" />
          <h2 className="text-white font-serif" style={{ fontSize: '20px', fontWeight: 600 }}>SIPAR</h2>
        </div>
        <p className="text-sidebar-foreground/70 text-xs leading-snug">Sistema Integrado de Processos, Aprovações &amp; Registos</p>
      </div>

      {/* User Info */}
      <button
        type="button"
        onClick={() => setPerfilOpen(true)}
        className="mb-4 p-3 bg-sidebar-accent border border-sidebar-border rounded-md text-left hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        title="Editar o meu perfil"
      >
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-sidebar-foreground" />
          <span className="font-medium text-sm text-white">{user.name}</span>
        </div>
        <p className="text-xs text-sidebar-foreground/70 mb-2">{user.email}</p>
        <Badge className={`${badgeInfo.color} text-white`}>{badgeInfo.label}</Badge>
      </button>

      <MeuPerfilDialog open={perfilOpen} onOpenChange={setPerfilOpen} />

      {/* Navigation */}
      <nav className="space-y-1 flex-1 overflow-y-auto overscroll-contain -mr-2 pr-2">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start rounded-sm border ${
                isActive
                  ? "bg-white/[0.08] border-sidebar-primary/35 text-white hover:bg-white/[0.08] hover:text-white"
                  : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              }`}
              onClick={() => onTabChange(item.id)}
              data-tab={item.id}
            >
              <Icon className={`mr-2 h-4 w-4 ${isActive ? "text-sidebar-primary" : "opacity-85"}`} />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-sidebar-border shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
          onClick={handleLogout}
        >
          {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Sair
        </Button>
      </div>
    </div>
  );
}