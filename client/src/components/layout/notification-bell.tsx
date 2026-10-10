import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, MessageSquare, Calendar, Mail, Receipt, Share2, UserCog } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";
import { tocarSomNotificacao } from "../../utils/notification-sound";

interface AppNotification {
  id: string;
  message: string;
  type: string;
  status: string;
  read: boolean;
  created_at: string;
  resourceId?: string;
}

type NotificationKind = "comunicado" | "reuniao" | "mensagem" | "factura" | "delegacao" | "sistema";

function classifyNotification(type: string): { kind: NotificationKind; label: string; icon: typeof Bell; tone: string; tab?: string } {
  if (type === "comunicacao_delegada") {
    return { kind: "delegacao", label: "Delegação", icon: Share2, tone: "accent", tab: "comunicacoes" };
  }
  if (type === "presentation_delegada" || type === "audience_delegada") {
    return { kind: "delegacao", label: "Delegação", icon: Share2, tone: "accent", tab: "history" };
  }
  if (type.startsWith("comunicacao_")) {
    return { kind: "comunicado", label: "Comunicado", icon: MessageSquare, tone: "gold", tab: "comunicacoes" };
  }
  if (type.includes("meeting") || type.startsWith("acta_")) {
    return { kind: "reuniao", label: "Reunião", icon: Calendar, tone: "success", tab: type === "external_meeting_scheduled" ? "schedule" : "internal-meetings" };
  }
  if (type === "message") {
    return { kind: "mensagem", label: "Mensagem", icon: Mail, tone: "info", tab: "messages" };
  }
  if (type.startsWith("factura_")) {
    return { kind: "factura", label: "Factura", icon: Receipt, tone: "danger", tab: "facturas" };
  }
  return { kind: "sistema", label: "Sistema", icon: UserCog, tone: "neutral", tab: type === "status_change" ? "history" : undefined };
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export function NotificationBell({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  // IDs ja vistos: na primeira carga so se memorizam; nas seguintes, uma
  // notificacao nova por ler (ex: factura submetida) toca um som.
  const vistas = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    if (!user?.email || !accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/user/${encodeURIComponent(user.email)}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const lista: AppNotification[] = json.notifications || [];
        const novas = vistas.current ? lista.filter((n) => !n.read && !vistas.current!.has(n.id)) : [];
        vistas.current = new Set(lista.map((n) => n.id));
        if (novas.length > 0) tocarSomNotificacao();
        setNotifications(lista);
      }
    } catch {
      // silencioso — o sino simplesmente fica vazio se a rede falhar
    }
  }, [user?.email, accessToken]);

  // Outro utilizador na mesma sessao: recomeca sem tocar pelas antigas.
  useEffect(() => { vistas.current = null; }, [user?.email]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemClick = async (n: AppNotification) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
      try {
        await fetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
          method: "PUT",
          headers: getAuthHeaders(),
        });
      } catch {
        // mantém o estado optimista mesmo se o pedido falhar
      }
    }
    const { tab } = classifyNotification(n.type);
    if (tab && onNavigate) {
      onNavigate(tab);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative w-9 h-9 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--muted)]"
          aria-label="Notificações"
        >
          <Bell className="h-[18px] w-[18px]" style={{ color: "var(--foreground)" }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: "var(--tone-danger)", fontSize: "10px", fontWeight: 700 }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0" style={{ borderRadius: "12px" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Notificações</p>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            {unreadCount > 0 ? `${unreadCount} por ler` : "Está tudo em dia"}
          </p>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
              <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Sem notificações</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((n) => {
              const { icon: Icon, label, tone } = classifyNotification(n.type);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--muted)] border-b last:border-b-0"
                  style={{ borderColor: "var(--border)", backgroundColor: n.read ? "transparent" : "var(--background)" }}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `var(--tone-${tone}-soft)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: `var(--tone-${tone})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "11px", fontWeight: 600, color: `var(--tone-${tone})`, textTransform: "uppercase", letterSpacing: ".02em" }}>
                        {label}
                      </span>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--tone-danger)" }} />
                      )}
                    </div>
                    <p
                      className="line-clamp-2"
                      style={{ fontSize: "13px", color: "var(--foreground)", fontWeight: n.read ? 400 : 600 }}
                    >
                      {n.message}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => {
              onNavigate("notifications");
              setOpen(false);
            }}
            className="w-full py-2.5 text-center hover:underline"
            style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ring)", borderTop: "1px solid var(--border)" }}
          >
            Ver todas as notificações
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
